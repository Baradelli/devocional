import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { CoverageStats } from '@devocional/shared';
import type { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { ImportTranslationInput } from '../../src/application/bible/ports.js';
import { buildServer } from '../../src/delivery/server.js';
import { createBibleModule } from '../../src/infrastructure/bible/bibleModule.js';
import type { Env } from '../../src/infrastructure/config/env.js';
import { createIdentityModule } from '../../src/infrastructure/identity/identityModule.js';
import { createScryptPasswordHasher } from '../../src/infrastructure/identity/passwordHasher.js';
import { createPrismaClient } from '../../src/infrastructure/prisma/client.js';
import { createStatsModule } from '../../src/infrastructure/stats/statsModule.js';

const apiRoot = fileURLToPath(new URL('../../', import.meta.url));
const samplePath = fileURLToPath(
  new URL('../../prisma/seed-data/sample-translation.json', import.meta.url),
);
const sample = JSON.parse(readFileSync(samplePath, 'utf8')) as ImportTranslationInput;
// A régua de cobertura é a ACF; o teste importa o sample com esse código.
const ruler: ImportTranslationInput = { ...sample, code: 'ACF', name: 'ACF (teste)' };

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let app: FastifyInstance;
let env: Env;
let translationId: string;

const ADMIN = { email: 'vitor@stats.test', password: 'admin-supersecret' };

async function seedPassage(
  date: string,
  ref: {
    bookReferenceId: number;
    chapter: number;
    verseStart: number;
    verseEnd: number;
  },
): Promise<void> {
  const devotional = await prisma.devotional.create({ data: { date, publishedAt: null } });
  await prisma.devotionalBlock.create({
    data: {
      devotionalId: devotional.id,
      type: 'PASSAGE',
      order: 1,
      reflectionQuestions: [],
      reflectionActions: [],
      passage: { create: { translationId, ...ref } },
    },
  });
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
    COOKIE_NAME: 'devocional_session',
    MEDIA_DIR: 'media-storage-test',
    SERVER_TIMEZONE: 'America/Sao_Paulo',
    VAPID_SUBJECT: 'mailto:test@devocional.app',
    APP_URL: 'http://localhost:5173',
    CORS_ORIGINS: [],
  };
  app = buildServer({ prisma, env, logger: false });
  await app.ready();

  await createIdentityModule(prisma).createAdminUser({
    name: 'Vitor',
    email: ADMIN.email,
    password: ADMIN.password,
    timezone: 'America/Sao_Paulo',
  });

  const result = await createBibleModule(prisma).importTranslation(ruler);
  translationId = result.translationId;

  // João 3:16-18 citado por dois devocionais (referência idêntica → conta 2x);
  // Salmos fica sem citação (livro não usado). Versículos distintos: 16,17,18.
  await seedPassage('2026-01-01', {
    bookReferenceId: 43,
    chapter: 3,
    verseStart: 16,
    verseEnd: 18,
  });
  await seedPassage('2026-01-02', {
    bookReferenceId: 43,
    chapter: 3,
    verseStart: 16,
    verseEnd: 18,
  });
});

afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
  await container?.stop();
});

async function adminCookie(): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: ADMIN.email, password: ADMIN.password },
  });
  const cookie = response.cookies.find((c) => c.name === env.COOKIE_NAME);
  if (!cookie) {
    throw new Error('Cookie de sessão ausente.');
  }
  return `${cookie.name}=${cookie.value}`;
}

describe('coverage stats (admin)', () => {
  it('computes coverage against the ruler, deduping verses across devotionals', async () => {
    const cookie = await adminCookie();
    const response = await app.inject({
      method: 'GET',
      url: '/admin/stats/coverage',
      headers: { cookie },
    });
    expect(response.statusCode).toBe(200);
    const stats = response.json<CoverageStats>();

    expect(stats.rulerTranslationCode).toBe('ACF');
    expect(stats.totalVerses).toBe(6); // 3 Salmos + 3 João
    expect(stats.coveredVerses).toBe(3); // 16,17,18 — dedup das duas passagens iguais
    expect(stats.coveragePct).toBe(50);
    expect(stats.devotionalCount).toBe(2);

    expect(stats.testaments.NEW).toEqual({ coveredVerses: 3, totalVerses: 3, devotionalCount: 2 });
    expect(stats.testaments.OLD).toEqual({ coveredVerses: 0, totalVerses: 3, devotionalCount: 0 });

    expect(stats.topBooks).toEqual([{ bookReferenceId: 43, name: 'João', citations: 2 }]);
    expect(stats.topPassages).toEqual([
      {
        label: 'João 3:16-18',
        bookReferenceId: 43,
        chapter: 3,
        verseStart: 16,
        verseEnd: 18,
        citations: 2,
      },
    ]);
    expect(stats.unusedBooks).toContainEqual({ bookReferenceId: 19, name: 'Salmos' });

    const john = stats.books.find((b) => b.bookReferenceId === 43);
    expect(john).toMatchObject({ coveredVerses: 3, totalVerses: 3, citations: 2 });
    expect(john?.chapters).toEqual([
      { chapter: 3, totalVerses: 3, coveredVerses: 3, citations: 2 },
    ]);

    const gospels = stats.sections.find((s) => s.key === 'GOSPELS');
    expect(gospels?.devotionalCount).toBe(2);
  });

  it('guards the dashboard: 401 anonymous, 403 for a member', async () => {
    const anon = await app.inject({ method: 'GET', url: '/admin/stats/coverage' });
    expect(anon.statusCode).toBe(401);

    const passwordHash = await createScryptPasswordHasher().hash('member-supersecret');
    await prisma.user.create({
      data: {
        name: 'Maria',
        email: 'maria@stats.test',
        passwordHash,
        role: 'MEMBER',
        timezone: 'America/Sao_Paulo',
      },
    });
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'maria@stats.test', password: 'member-supersecret' },
    });
    const cookie = login.cookies.find((c) => c.name === env.COOKIE_NAME);
    const member = await app.inject({
      method: 'GET',
      url: '/admin/stats/coverage',
      headers: { cookie: `${cookie!.name}=${cookie!.value}` },
    });
    expect(member.statusCode).toBe(403);
  });
});

describe('engagement stats (admin)', () => {
  const round1 = (value: number) => Math.round(value * 10) / 10;
  let memberCookieValue: string;

  beforeAll(async () => {
    const passwordHash = await createScryptPasswordHasher().hash('member-supersecret');
    const members = await Promise.all(
      ['a', 'b', 'c', 'd'].map((slug) =>
        prisma.user.create({
          data: {
            name: `Membro ${slug}`,
            email: `${slug}@engagement.test`,
            passwordHash,
            role: 'MEMBER',
            timezone: 'UTC',
          },
        }),
      ),
    );
    const [uA, uB, uC, uD] = members;

    const devoX = await prisma.devotional.create({
      data: { date: '2026-03-10', theme: 'Graça', publishedAt: new Date('2026-03-10T00:00:00Z') },
    });
    const devoY = await prisma.devotional.create({
      data: { date: '2026-03-11', publishedAt: new Date('2026-03-11T00:00:00Z') },
    });

    const completion = (userId: string, logicalDate: string, devotionalId: string) =>
      prisma.dailyCompletion.create({
        data: {
          userId,
          logicalDate,
          devotionalId,
          idempotencyKey: `${userId}-${logicalDate}`,
          completedAt: new Date(`${logicalDate}T12:00:00Z`),
        },
      });

    await completion(uA!.id, '2026-01-15', devoX.id); // hoje
    await completion(uA!.id, '2026-01-05', devoY.id); // semana passada
    await completion(uB!.id, '2026-01-14', devoX.id); // esta semana
    await completion(uC!.id, '2026-01-03', devoY.id); // só semana passada
    await completion(uD!.id, '2026-01-12', devoX.id); // esta semana

    await prisma.streakState.create({
      data: { userId: uA!.id, currentStreak: 5, longestStreak: 10 },
    });
    await prisma.streakState.create({
      data: { userId: uB!.id, currentStreak: 0, longestStreak: 3 },
    });

    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'a@engagement.test', password: 'member-supersecret' },
    });
    const cookie = login.cookies.find((c) => c.name === env.COOKIE_NAME);
    memberCookieValue = `${cookie!.name}=${cookie!.value}`;
  });

  it('aggregates active users, retention, streaks and most-completed for a fixed today', async () => {
    const stats = createStatsModule(prisma, {
      serverTimezone: 'UTC',
      now: () => new Date('2026-01-15T12:00:00Z'),
    });
    const eng = await stats.computeEngagement();

    expect(eng.referenceDate).toBe('2026-01-15');
    expect(eng.activeUsers7d).toBe(3); // A(15), B(14), D(12)
    expect(eng.retention).toEqual({
      thisWeekActive: 3,
      lastWeekActive: 2, // A(05), C(03)
      retained: 1, // só A em ambas as semanas
      retentionPct: 50,
    });
    expect(eng.streaks).toEqual({ averageCurrent: 2.5, longest: 10 });
    expect(eng.mostCompleted[0]?.completions).toBe(3); // devoX: A,B,D
    expect(eng.mostCompleted[0]?.theme).toBe('Graça');
    // Taxa do dia: só A concluiu em 2026-01-15, sobre todos os cadastrados.
    expect(eng.dailyCompletionRate.today).toBe(round1((1 / eng.registeredUsers) * 100));
  });

  it('guards the dashboard: 401 anonymous, 403 for a member', async () => {
    const anon = await app.inject({ method: 'GET', url: '/admin/stats/engagement' });
    expect(anon.statusCode).toBe(401);

    const member = await app.inject({
      method: 'GET',
      url: '/admin/stats/engagement',
      headers: { cookie: memberCookieValue },
    });
    expect(member.statusCode).toBe(403);
  });
});
