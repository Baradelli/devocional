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
});
