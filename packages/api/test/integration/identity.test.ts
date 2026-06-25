import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import type { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildServer } from '../../src/delivery/server.js';
import type { Env } from '../../src/infrastructure/config/env.js';
import { createIdentityModule } from '../../src/infrastructure/identity/identityModule.js';
import { createPrismaClient } from '../../src/infrastructure/prisma/client.js';

const apiRoot = fileURLToPath(new URL('../../', import.meta.url));

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let app: FastifyInstance;
let env: Env;

let adminId: string;

const ADMIN = { email: 'vitor@devocional.test', password: 'admin-supersecret' };

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const databaseUrl = container.getConnectionUri();

  execSync('pnpm exec prisma migrate deploy', {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  prisma = createPrismaClient(databaseUrl);
  await prisma.$connect();

  env = {
    NODE_ENV: 'test',
    DATABASE_URL: databaseUrl,
    PORT: 3000,
    COOKIE_NAME: 'devocional_session',
    MEDIA_DIR: 'media-storage-test',
    SERVER_TIMEZONE: 'America/Sao_Paulo',
    VAPID_SUBJECT: 'mailto:test@devocional.app',
    APP_URL: 'http://localhost:5173',
    CORS_ORIGINS: [],
  };
  app = buildServer({ prisma, env, logger: false });
  await app.ready();

  const admin = await createIdentityModule(prisma).createAdminUser({
    name: 'Vitor',
    email: ADMIN.email,
    password: ADMIN.password,
    timezone: 'America/Sao_Paulo',
  });
  adminId = admin.id;
});

afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
  await container?.stop();
});

function sessionCookie(response: { cookies: { name: string; value: string }[] }): string {
  const cookie = response.cookies.find((c) => c.name === env.COOKIE_NAME);
  if (!cookie) {
    throw new Error('Cookie de sessão ausente na resposta.');
  }
  return `${cookie.name}=${cookie.value}`;
}

async function loginAs(email: string, password: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password },
  });
  expect(response.statusCode).toBe(200);
  return sessionCookie(response);
}

describe('auth + invite flow', () => {
  it('logs the admin in and exposes the ADMIN role on /auth/me', async () => {
    const cookie = await loginAs(ADMIN.email, ADMIN.password);

    const me = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ email: ADMIN.email, role: 'ADMIN' });
  });

  it('rejects wrong credentials with 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: ADMIN.email, password: 'wrong' },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: 'INVALID_CREDENTIALS' });
  });

  it('guards /admin/invites: 401 anonymous, 201 for admin', async () => {
    const anon = await app.inject({
      method: 'POST',
      url: '/admin/invites',
      payload: { expiresInDays: 14 },
    });
    expect(anon.statusCode).toBe(401);

    const cookie = await loginAs(ADMIN.email, ADMIN.password);
    const created = await app.inject({
      method: 'POST',
      url: '/admin/invites',
      headers: { cookie },
      payload: { expiresInDays: 14 },
    });
    expect(created.statusCode).toBe(201);
    const createdBody = created.json<{ status: string; code: string }>();
    expect(createdBody.status).toBe('PENDING');
    expect(typeof createdBody.code).toBe('string');
  });

  it('registers a member via a valid invite, then refuses to reuse it', async () => {
    const adminCookie = await loginAs(ADMIN.email, ADMIN.password);
    const invite = await app.inject({
      method: 'POST',
      url: '/admin/invites',
      headers: { cookie: adminCookie },
      payload: { expiresInDays: 14 },
    });
    const code = invite.json<{ code: string }>().code;

    const register = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        inviteCode: code,
        name: 'Maria',
        email: 'maria@devocional.test',
        password: 'member-supersecret',
        timezone: 'America/Sao_Paulo',
      },
    });
    expect(register.statusCode).toBe(201);
    expect(register.json()).toMatchObject({ email: 'maria@devocional.test', role: 'MEMBER' });

    const memberCookie = sessionCookie(register);
    const me = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { cookie: memberCookie },
    });
    expect(me.statusCode).toBe(200);

    // Convite já consumido → reutilizar deve falhar.
    const reuse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        inviteCode: code,
        name: 'Outro',
        email: 'outro@devocional.test',
        password: 'member-supersecret',
        timezone: 'America/Sao_Paulo',
      },
    });
    expect(reuse.statusCode).toBe(409);
    expect(reuse.json()).toMatchObject({ error: 'INVITE_ALREADY_USED' });
  });

  it('a member cannot reach /admin/invites (403)', async () => {
    const cookie = await loginAs('maria@devocional.test', 'member-supersecret');
    const response = await app.inject({
      method: 'POST',
      url: '/admin/invites',
      headers: { cookie },
      payload: { expiresInDays: 14 },
    });
    expect(response.statusCode).toBe(403);
  });

  it('rejects an unknown invite code with 404', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        inviteCode: 'DOESNOTEXIST',
        name: 'Ninguém',
        email: 'ninguem@devocional.test',
        password: 'member-supersecret',
        timezone: 'America/Sao_Paulo',
      },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: 'INVITE_NOT_FOUND' });
  });

  it('rejects an expired invite with 410', async () => {
    await prisma.invite.create({
      data: {
        code: 'EXPIREDCODE1',
        expiresAt: new Date(Date.now() - 60_000),
        createdById: adminId,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        inviteCode: 'EXPIREDCODE1',
        name: 'Atrasado',
        email: 'atrasado@devocional.test',
        password: 'member-supersecret',
        timezone: 'America/Sao_Paulo',
      },
    });
    expect(response.statusCode).toBe(410);
    expect(response.json()).toMatchObject({ error: 'INVITE_EXPIRED' });
  });

  it('revokes the session on logout (server authority)', async () => {
    const cookie = await loginAs(ADMIN.email, ADMIN.password);

    const before = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } });
    expect(before.statusCode).toBe(200);

    const logout = await app.inject({ method: 'POST', url: '/auth/logout', headers: { cookie } });
    expect(logout.statusCode).toBe(204);

    // Mesmo cookie, sessão revogada no servidor → 401.
    const after = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } });
    expect(after.statusCode).toBe(401);
  });

  it('marks onboarding as completed (idempotent)', async () => {
    const adminCookie = await loginAs(ADMIN.email, ADMIN.password);
    const invite = await app.inject({
      method: 'POST',
      url: '/admin/invites',
      headers: { cookie: adminCookie },
      payload: { expiresInDays: 14 },
    });
    const register = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        inviteCode: invite.json<{ code: string }>().code,
        name: 'Joana',
        email: 'joana@devocional.test',
        password: 'member-supersecret',
        timezone: 'America/Sao_Paulo',
      },
    });
    const cookie = sessionCookie(register);
    expect(
      register.json<{ onboardingCompletedAt: string | null }>().onboardingCompletedAt,
    ).toBeNull();

    const complete = await app.inject({
      method: 'POST',
      url: '/auth/onboarding/complete',
      headers: { cookie },
    });
    expect(complete.statusCode).toBe(200);
    const firstAt = complete.json<{ onboardingCompletedAt: string | null }>().onboardingCompletedAt;
    expect(firstAt).not.toBeNull();

    // Rever depois não reescreve o timestamp original.
    const again = await app.inject({
      method: 'POST',
      url: '/auth/onboarding/complete',
      headers: { cookie },
    });
    expect(again.json<{ onboardingCompletedAt: string | null }>().onboardingCompletedAt).toBe(
      firstAt,
    );

    const me = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } });
    expect(me.json<{ onboardingCompletedAt: string | null }>().onboardingCompletedAt).toBe(firstAt);
  });

  it('deletes the account and all owned data, keeping the consumed invite (LGPD)', async () => {
    const adminCookie = await loginAs(ADMIN.email, ADMIN.password);
    const invite = await app.inject({
      method: 'POST',
      url: '/admin/invites',
      headers: { cookie: adminCookie },
      payload: { expiresInDays: 14 },
    });
    const inviteCode = invite.json<{ code: string }>().code;
    const register = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        inviteCode,
        name: 'Pedro',
        email: 'pedro@devocional.test',
        password: 'member-supersecret',
        timezone: 'America/Sao_Paulo',
      },
    });
    const cookie = sessionCookie(register);
    const userId = register.json<{ id: string }>().id;

    // Semeia dados de propriedade do usuário em todas as tabelas relacionadas.
    const devotional = await prisma.devotional.create({ data: { date: '2026-06-16' } });
    await prisma.dailyCompletion.create({
      data: {
        userId,
        logicalDate: '2026-06-16',
        idempotencyKey: 'lgpd-key-1',
        completedAt: new Date('2026-06-16T12:00:00Z'),
      },
    });
    await prisma.streakState.create({ data: { userId, currentStreak: 1 } });
    await prisma.achievement.create({
      data: { userId, type: 'WEEKLY_BADGE', milestone: 7 },
    });
    await prisma.note.create({
      data: {
        userId,
        devotionalId: devotional.id,
        text: 'anotação privada',
        idempotencyKey: 'lgpd-note-1',
        editedAt: new Date('2026-06-16T12:00:00Z'),
      },
    });
    await prisma.pushSubscription.create({
      data: { userId, endpoint: 'https://push.example/lgpd', p256dh: 'k', auth: 'a' },
    });
    await prisma.whatsappContact.create({ data: { userId, phone: '+5511999990000' } });
    await prisma.reminderPreference.create({ data: { userId, localTime: '08:00' } });

    const remove = await app.inject({ method: 'DELETE', url: '/auth/me', headers: { cookie } });
    expect(remove.statusCode).toBe(204);

    // Sessão limpa: o mesmo cookie não autentica mais.
    const after = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } });
    expect(after.statusCode).toBe(401);

    // Usuário e todos os dados de sua propriedade foram apagados (cascata).
    expect(await prisma.user.findUnique({ where: { id: userId } })).toBeNull();
    expect(await prisma.dailyCompletion.count({ where: { userId } })).toBe(0);
    expect(await prisma.streakState.count({ where: { userId } })).toBe(0);
    expect(await prisma.achievement.count({ where: { userId } })).toBe(0);
    expect(await prisma.note.count({ where: { userId } })).toBe(0);
    expect(await prisma.pushSubscription.count({ where: { userId } })).toBe(0);
    expect(await prisma.whatsappContact.count({ where: { userId } })).toBe(0);
    expect(await prisma.reminderPreference.count({ where: { userId } })).toBe(0);

    // O convite consumido permanece (auditoria), sem reabrir para reuso.
    const consumed = await prisma.invite.findUnique({ where: { code: inviteCode } });
    expect(consumed?.status).toBe('USED');
  });

  it('refuses to delete the admin account (403)', async () => {
    const cookie = await loginAs(ADMIN.email, ADMIN.password);
    const response = await app.inject({ method: 'DELETE', url: '/auth/me', headers: { cookie } });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ error: 'CANNOT_DELETE_ADMIN' });

    // O admin continua válido após a recusa.
    const me = await app.inject({ method: 'GET', url: '/auth/me', headers: { cookie } });
    expect(me.statusCode).toBe(200);
  });

  it('defaults invite expiry to about one day', async () => {
    const cookie = await loginAs(ADMIN.email, ADMIN.password);
    const created = await app.inject({
      method: 'POST',
      url: '/admin/invites',
      headers: { cookie },
      payload: {},
    });
    expect(created.statusCode).toBe(201);
    const { expiresAt } = created.json<{ expiresAt: string }>();
    const ms = new Date(expiresAt).getTime() - Date.now();
    // ~24h, com folga para o tempo de execução do teste.
    expect(ms).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(ms).toBeLessThan(25 * 60 * 60 * 1000);
  });

  it('exposes registerUrl and the redeemer (usedBy) on listed invites', async () => {
    const cookie = await loginAs(ADMIN.email, ADMIN.password);
    const created = await app.inject({
      method: 'POST',
      url: '/admin/invites',
      headers: { cookie },
      payload: { expiresInDays: 14 },
    });
    const code = created.json<{ code: string }>().code;
    // O link de cadastro é montado pela API a partir de APP_URL.
    expect(created.json<{ registerUrl: string }>().registerUrl).toBe(
      `${env.APP_URL}/register?code=${code}`,
    );
    // Convite recém-criado ainda não tem quem resgatou.
    expect(created.json<{ usedBy: unknown }>().usedBy).toBeNull();

    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        inviteCode: code,
        name: 'Resgatador',
        email: 'resgatador@devocional.test',
        password: 'member-supersecret',
        timezone: 'America/Sao_Paulo',
      },
    });

    const list = await app.inject({ method: 'GET', url: '/admin/invites', headers: { cookie } });
    expect(list.statusCode).toBe(200);
    const found = list
      .json<{ code: string; usedBy: { name: string; email: string } | null }[]>()
      .find((i) => i.code === code);
    expect(found?.usedBy).toEqual({ name: 'Resgatador', email: 'resgatador@devocional.test' });
  });

  it('binds an invite to an email and rejects a mismatched registration (403)', async () => {
    const cookie = await loginAs(ADMIN.email, ADMIN.password);
    const created = await app.inject({
      method: 'POST',
      url: '/admin/invites',
      headers: { cookie },
      payload: { email: 'bound@devocional.test', expiresInDays: 14 },
    });
    const code = created.json<{ code: string }>().code;

    const mismatch = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        inviteCode: code,
        name: 'Intruso',
        email: 'intruso@devocional.test',
        password: 'member-supersecret',
        timezone: 'America/Sao_Paulo',
      },
    });
    expect(mismatch.statusCode).toBe(403);
    expect(mismatch.json()).toMatchObject({ error: 'INVITE_EMAIL_MISMATCH' });

    const ok = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        inviteCode: code,
        name: 'Convidado',
        email: 'bound@devocional.test',
        password: 'member-supersecret',
        timezone: 'America/Sao_Paulo',
      },
    });
    expect(ok.statusCode).toBe(201);
  });

  it('revokes a pending invite and then refuses registration with it (410)', async () => {
    const cookie = await loginAs(ADMIN.email, ADMIN.password);
    const created = await app.inject({
      method: 'POST',
      url: '/admin/invites',
      headers: { cookie },
      payload: { expiresInDays: 14 },
    });
    const { id, code } = created.json<{ id: string; code: string }>();

    const revoke = await app.inject({
      method: 'POST',
      url: `/admin/invites/${id}/revoke`,
      headers: { cookie },
    });
    expect(revoke.statusCode).toBe(200);
    expect(revoke.json<{ status: string }>().status).toBe('REVOKED');

    const register = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        inviteCode: code,
        name: 'Tarde',
        email: 'tarde@devocional.test',
        password: 'member-supersecret',
        timezone: 'America/Sao_Paulo',
      },
    });
    expect(register.statusCode).toBe(410);
    expect(register.json()).toMatchObject({ error: 'INVITE_REVOKED' });
  });

  it('refuses to revoke an already-used invite (409)', async () => {
    const cookie = await loginAs(ADMIN.email, ADMIN.password);
    const created = await app.inject({
      method: 'POST',
      url: '/admin/invites',
      headers: { cookie },
      payload: { expiresInDays: 14 },
    });
    const { id, code } = created.json<{ id: string; code: string }>();
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        inviteCode: code,
        name: 'Usou',
        email: 'usou@devocional.test',
        password: 'member-supersecret',
        timezone: 'America/Sao_Paulo',
      },
    });

    const revoke = await app.inject({
      method: 'POST',
      url: `/admin/invites/${id}/revoke`,
      headers: { cookie },
    });
    expect(revoke.statusCode).toBe(409);
    expect(revoke.json()).toMatchObject({ error: 'INVITE_ALREADY_USED' });
  });

  it('guards revoke: 401 anonymous, 403 member', async () => {
    const adminCookie = await loginAs(ADMIN.email, ADMIN.password);
    const created = await app.inject({
      method: 'POST',
      url: '/admin/invites',
      headers: { cookie: adminCookie },
      payload: { expiresInDays: 14 },
    });
    const id = created.json<{ id: string }>().id;

    const anon = await app.inject({ method: 'POST', url: `/admin/invites/${id}/revoke` });
    expect(anon.statusCode).toBe(401);

    const memberCookie = await loginAs('maria@devocional.test', 'member-supersecret');
    const member = await app.inject({
      method: 'POST',
      url: `/admin/invites/${id}/revoke`,
      headers: { cookie: memberCookie },
    });
    expect(member.statusCode).toBe(403);
  });
});
