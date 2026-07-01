import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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

const apiRoot = fileURLToPath(new URL('../../', import.meta.url));
const samplePath = fileURLToPath(
  new URL('../../prisma/seed-data/sample-translation.json', import.meta.url),
);
const sample = JSON.parse(readFileSync(samplePath, 'utf8')) as ImportTranslationInput;

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let app: FastifyInstance;
let env: Env;
let translationId: string;

const ADMIN = { email: 'vitor@bible.test', password: 'admin-supersecret' };

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

  await createIdentityModule(prisma).createAdminUser({
    name: 'Vitor',
    email: ADMIN.email,
    password: ADMIN.password,
    timezone: 'America/Sao_Paulo',
  });

  const result = await createBibleModule(prisma).importTranslation(sample);
  translationId = result.translationId;
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
  expect(response.statusCode).toBe(200);
  const cookie = response.cookies.find((c) => c.name === env.COOKIE_NAME);
  if (!cookie) {
    throw new Error('Cookie de sessão ausente.');
  }
  return `${cookie.name}=${cookie.value}`;
}

describe('bible importer', () => {
  it('is idempotent: re-importing inserts no new verses and keeps counts stable', async () => {
    const before = await prisma.verse.count();
    const result = await createBibleModule(prisma).importTranslation(sample);

    expect(result.insertedVerseCount).toBe(0);
    expect(await prisma.verse.count()).toBe(before);
    expect(await prisma.translation.count({ where: { code: 'DEMO' } })).toBe(1);
  });
});

describe('bible selector (admin)', () => {
  it('lists books ordered by canonical reference', async () => {
    const cookie = await adminCookie();
    const response = await app.inject({
      method: 'GET',
      url: `/admin/bible/translations/${translationId}/books`,
      headers: { cookie },
    });
    expect(response.statusCode).toBe(200);
    const books = response.json<{ bookReferenceId: number; name: string }[]>();
    expect(books.map((b) => b.bookReferenceId)).toEqual([19, 43]); // Salmos, depois João
  });

  it('lists chapters with verse counts for a book', async () => {
    const cookie = await adminCookie();
    const booksResponse = await app.inject({
      method: 'GET',
      url: `/admin/bible/translations/${translationId}/books`,
      headers: { cookie },
    });
    const john = booksResponse
      .json<{ id: string; bookReferenceId: number }[]>()
      .find((b) => b.bookReferenceId === 43);

    const chapters = await app.inject({
      method: 'GET',
      url: `/admin/bible/books/${john!.id}/chapters`,
      headers: { cookie },
    });
    expect(chapters.statusCode).toBe(200);
    expect(chapters.json()).toEqual([{ chapter: 3, verseCount: 3 }]);
  });

  it('assembles the passage text for a range (reference, not stored text)', async () => {
    const cookie = await adminCookie();
    const response = await app.inject({
      method: 'GET',
      url: `/admin/bible/passage?translationId=${translationId}&bookReferenceId=43&chapter=3&verseStart=16&verseEnd=18`,
      headers: { cookie },
    });
    expect(response.statusCode).toBe(200);
    const preview = response.json<{ label: string; verses: unknown[]; text: string }>();
    expect(preview.label).toBe('João 3:16-18');
    expect(preview.verses).toHaveLength(3);
    expect(preview.text).toContain('Porque Deus amou o mundo');
    expect(preview.text).toContain('já está condenado');
  });

  it('rejects an inverted verse range with 400', async () => {
    const cookie = await adminCookie();
    const response = await app.inject({
      method: 'GET',
      url: `/admin/bible/passage?translationId=${translationId}&bookReferenceId=43&chapter=3&verseStart=18&verseEnd=16`,
      headers: { cookie },
    });
    expect(response.statusCode).toBe(400);
  });

  it('returns 404 for a book absent from the translation', async () => {
    const cookie = await adminCookie();
    const response = await app.inject({
      method: 'GET',
      url: `/admin/bible/passage?translationId=${translationId}&bookReferenceId=1&chapter=1&verseStart=1&verseEnd=1`,
      headers: { cookie },
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: 'BOOK_NOT_FOUND' });
  });

  it('guards the selector: 401 anonymous, 403 for a member', async () => {
    const anon = await app.inject({ method: 'GET', url: '/admin/bible/translations' });
    expect(anon.statusCode).toBe(401);

    const passwordHash = await createScryptPasswordHasher().hash('member-supersecret');
    await prisma.user.create({
      data: {
        name: 'Maria',
        email: 'maria@bible.test',
        passwordHash,
        role: 'MEMBER',
        timezone: 'America/Sao_Paulo',
      },
    });
    const login = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'maria@bible.test', password: 'member-supersecret' },
    });
    const cookie = login.cookies.find((c) => c.name === env.COOKIE_NAME);
    const member = await app.inject({
      method: 'GET',
      url: '/admin/bible/translations',
      headers: { cookie: `${cookie!.name}=${cookie!.value}` },
    });
    expect(member.statusCode).toBe(403);
  });
});
