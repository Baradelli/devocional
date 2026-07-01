import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import type { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildServer } from '../../src/delivery/server.js';
import type { Env } from '../../src/infrastructure/config/env.js';
import { createScryptPasswordHasher } from '../../src/infrastructure/identity/passwordHasher.js';
import { createPrismaClient } from '../../src/infrastructure/prisma/client.js';

const apiRoot = fileURLToPath(new URL('../../', import.meta.url));

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let app: FastifyInstance;
let env: Env;

const PASSWORD = 'member-supersecret';

interface SnapshotBody {
  streak: { currentStreak: number; longestStreak: number; treeStage: string };
  newAchievements: { type: string; milestone: number }[];
}
interface ProgressBody {
  streak: { currentStreak: number; treeStage: string };
  achievements: { type: string; milestone: number }[];
}
interface CalendarBody {
  month: string;
  completedDates: string[];
}

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
    HOST: '127.0.0.1',
    COOKIE_NAME: 'devocional_session',
    MEDIA_DIR: 'media-storage-test',
    SERVER_TIMEZONE: 'America/Sao_Paulo',
    VAPID_SUBJECT: 'mailto:test@devocional.app',
    APP_URL: 'http://localhost:5173',
    CORS_ORIGINS: [],
  };
  app = buildServer({ prisma, env, logger: false });
  await app.ready();
});

afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
  await container?.stop();
});

async function createMember(email: string): Promise<void> {
  const passwordHash = await createScryptPasswordHasher().hash(PASSWORD);
  await prisma.user.create({
    data: { name: 'Fiel', email, passwordHash, role: 'MEMBER', timezone: 'America/Sao_Paulo' },
  });
}

async function loginAs(email: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password: PASSWORD },
  });
  expect(response.statusCode).toBe(200);
  const cookie = response.cookies.find((c) => c.name === env.COOKIE_NAME);
  if (!cookie) {
    throw new Error('Cookie de sessão ausente.');
  }
  return `${cookie.name}=${cookie.value}`;
}

async function complete(cookie: string, completedAt: string, idempotencyKey: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/progress/complete',
    headers: { cookie },
    payload: { completedAt, idempotencyKey },
  });
  expect(response.statusCode).toBe(200);
  return response.json<SnapshotBody>();
}

describe('progress: completion (server-authoritative streak)', () => {
  it('progresses, is idempotent, resets on a skipped day, and respects the user timezone', async () => {
    await createMember('a@devocional.test');
    const cookie = await loginAs('a@devocional.test');

    // Dia 1 → streak 1 (broto).
    const day1 = await complete(cookie, '2026-06-16T12:00:00Z', 'a-1');
    expect(day1.streak.currentStreak).toBe(1);
    expect(day1.streak.treeStage).toBe('SPROUT');

    // Reenvio da MESMA chave → idempotente, sem dupla contagem.
    const repeat = await complete(cookie, '2026-06-16T12:00:00Z', 'a-1');
    expect(repeat.streak.currentStreak).toBe(1);

    // Dia consecutivo → streak 2.
    const day2 = await complete(cookie, '2026-06-17T12:00:00Z', 'a-2');
    expect(day2.streak.currentStreak).toBe(2);

    // Mesmo dia lógico, chave diferente → idempotente por (user, dia).
    const sameDay = await complete(cookie, '2026-06-17T20:00:00Z', 'a-2b');
    expect(sameDay.streak.currentStreak).toBe(2);

    // Pula o dia 18 → reset para 1 ao concluir o dia 19.
    const afterGap = await complete(cookie, '2026-06-19T12:00:00Z', 'a-3');
    expect(afterGap.streak.currentStreak).toBe(1);
    expect(afterGap.streak.longestStreak).toBe(2);

    // Autoridade do fuso: 02:30Z do dia 20 = 23:30 do dia 19 em São Paulo →
    // o servidor atribui ao dia 19 (já concluído) → idempotente, sem contar.
    const tzAuthority = await complete(cookie, '2026-06-20T02:30:00Z', 'a-4');
    expect(tzAuthority.streak.currentStreak).toBe(1);

    const completions = await prisma.dailyCompletion.count({
      where: { user: { email: 'a@devocional.test' } },
    });
    expect(completions).toBe(3); // dias 16, 17 e 19
  });
});

describe('progress: offline sync + achievement permanence', () => {
  it('reconciles a 7-day queue, grants the weekly badge, and keeps it after a reset', async () => {
    await createMember('b@devocional.test');
    const cookie = await loginAs('b@devocional.test');

    // Fila offline de 7 dias consecutivos, embaralhada.
    const queue = [3, 1, 7, 5, 2, 6, 4].map((d) => ({
      completedAt: `2026-06-0${String(d)}T12:00:00Z`,
      idempotencyKey: `b-${String(d)}`,
    }));

    const sync = await app.inject({
      method: 'POST',
      url: '/progress/sync',
      headers: { cookie },
      payload: { completions: queue },
    });
    expect(sync.statusCode).toBe(200);
    const synced = sync.json<SnapshotBody>();
    expect(synced.streak.currentStreak).toBe(7);
    expect(synced.streak.treeStage).toBe('TRUNK');
    expect(synced.newAchievements).toContainEqual(
      expect.objectContaining({ type: 'WEEKLY_BADGE', milestone: 7 }),
    );

    // Reenviar a mesma fila → idempotente, sem novas conquistas, streak intacto.
    const resync = await app.inject({
      method: 'POST',
      url: '/progress/sync',
      headers: { cookie },
      payload: { completions: queue },
    });
    const resynced = resync.json<SnapshotBody>();
    expect(resynced.streak.currentStreak).toBe(7);
    expect(resynced.newAchievements).toEqual([]);

    // Pula dias → streak zera, mas a conquista é permanente.
    await complete(cookie, '2026-06-15T12:00:00Z', 'b-break');
    const progress = await app.inject({
      method: 'GET',
      url: '/progress',
      headers: { cookie },
    });
    const view = progress.json<ProgressBody>();
    expect(view.streak.currentStreak).toBe(1);
    expect(view.streak.treeStage).toBe('SPROUT');
    expect(view.achievements).toContainEqual(
      expect.objectContaining({ type: 'WEEKLY_BADGE', milestone: 7 }),
    );
  });
});

describe('progress: calendar (completed logical dates by month)', () => {
  it('returns the user’s completed days of a month, scoped by month and user', async () => {
    await createMember('c@devocional.test');
    const cookie = await loginAs('c@devocional.test');

    // Conclui dias em maio e junho (fuso São Paulo: 12:00Z cai no mesmo dia).
    await complete(cookie, '2026-05-30T12:00:00Z', 'c-1');
    await complete(cookie, '2026-06-01T12:00:00Z', 'c-2');
    await complete(cookie, '2026-06-02T12:00:00Z', 'c-3');

    // Outro usuário não deve vazar para o calendário deste.
    await createMember('d@devocional.test');
    const otherCookie = await loginAs('d@devocional.test');
    await complete(otherCookie, '2026-06-05T12:00:00Z', 'd-1');

    const june = await app.inject({
      method: 'GET',
      url: '/progress/calendar?month=2026-06',
      headers: { cookie },
    });
    expect(june.statusCode).toBe(200);
    expect(june.json<CalendarBody>()).toEqual({
      month: '2026-06',
      completedDates: ['2026-06-01', '2026-06-02'],
    });

    const may = await app.inject({
      method: 'GET',
      url: '/progress/calendar?month=2026-05',
      headers: { cookie },
    });
    expect(may.json<CalendarBody>().completedDates).toEqual(['2026-05-30']);

    // Mês inválido → 400 (validação Zod na borda).
    const bad = await app.inject({
      method: 'GET',
      url: '/progress/calendar?month=2026-6',
      headers: { cookie },
    });
    expect(bad.statusCode).toBe(400);
  });
});
