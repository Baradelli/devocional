import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
let cookie: string;

const ADMIN = { email: 'vitor@content.test', password: 'admin-supersecret' };

const johnReference = (translation: string) => ({
  translationId: translation,
  bookReferenceId: 43,
  chapter: 3,
  verseStart: 16,
  verseEnd: 18,
});

function devotionalBody(date: string, audioMediaId?: string) {
  return {
    date,
    theme: 'Graça',
    quote: { text: 'Comece aqui.' },
    passage: { reference: johnReference(translationId) },
    devotional: { text: 'A reflexão do dia.', ...(audioMediaId ? { audioMediaId } : {}) },
    prayer: { text: 'Senhor, obrigado.' },
    reflection: {
      questions: ['O que tocou você?', 'Onde aplicar?', 'Pelo que orar?'],
      actions: ['Ligar para alguém', 'Anotar um agradecimento', 'Servir hoje'],
    },
  };
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
    MEDIA_DIR: path.join(tmpdir(), `devocional-media-${randomUUID()}`),
    SERVER_TIMEZONE: 'America/Sao_Paulo',
  };
  app = buildServer({ prisma, env, logger: false });
  await app.ready();

  await createIdentityModule(prisma).createAdminUser({
    name: 'Vitor',
    email: ADMIN.email,
    password: ADMIN.password,
    timezone: 'America/Sao_Paulo',
  });
  translationId = (await createBibleModule(prisma).importTranslation(sample)).translationId;

  const login = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: ADMIN.email, password: ADMIN.password },
  });
  const sessionCookie = login.cookies.find((c) => c.name === env.COOKIE_NAME);
  cookie = `${sessionCookie!.name}=${sessionCookie!.value}`;
});

afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
  await container?.stop();
});

async function uploadAudio(content: string): Promise<string> {
  const boundary = '----devocionalboundary';
  const payload = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.mp3"\r\n` +
        `Content-Type: audio/mpeg\r\n\r\n`,
    ),
    Buffer.from(content),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const response = await app.inject({
    method: 'POST',
    url: '/admin/media?type=AUDIO',
    headers: { cookie, 'content-type': `multipart/form-data; boundary=${boundary}` },
    payload,
  });
  expect(response.statusCode).toBe(201);
  return response.json<{ id: string; url: string }>().id;
}

describe('content authoring', () => {
  it('uploads media and serves it back', async () => {
    const mediaId = await uploadAudio('FAKE_AUDIO_BYTES');
    const served = await app.inject({
      method: 'GET',
      url: `/media/${mediaId}`,
      headers: { cookie },
    });
    expect(served.statusCode).toBe(200);
    expect(served.headers['content-type']).toContain('audio/mpeg');
    expect(served.body).toBe('FAKE_AUDIO_BYTES');
  });

  it('creates a devotional and assembles its blocks (passage text + media url)', async () => {
    const audioId = await uploadAudio('DEVOTIONAL_AUDIO');

    const created = await app.inject({
      method: 'POST',
      url: '/admin/devotionals',
      headers: { cookie },
      payload: devotionalBody('2026-06-20', audioId),
    });
    expect(created.statusCode).toBe(201);

    const view = await app.inject({
      method: 'GET',
      url: '/admin/devotionals/2026-06-20',
      headers: { cookie },
    });
    expect(view.statusCode).toBe(200);
    const body = view.json<{
      publishedAt: string | null;
      blocks: {
        type: string;
        text?: string;
        audioUrl?: string | null;
        questions?: string[];
        actions?: string[];
      }[];
    }>();

    expect(body.publishedAt).toBeNull();
    expect(body.blocks.map((b) => b.type)).toEqual([
      'QUOTE',
      'PASSAGE',
      'DEVOTIONAL',
      'PRAYER',
      'REFLECTION',
    ]);
    expect(body.blocks[1]?.text).toContain('Porque Deus amou o mundo');
    expect(body.blocks[2]?.audioUrl).toBe(`/media/${audioId}`);
    expect(body.blocks[4]?.questions).toHaveLength(3);
    expect(body.blocks[4]?.actions).toHaveLength(3);
  });

  it('refuses a duplicate date with 409', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/admin/devotionals',
      headers: { cookie },
      payload: devotionalBody('2026-06-20'),
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: 'DEVOTIONAL_EXISTS' });
  });

  it('publishes only devotionals whose date has arrived', async () => {
    await app.inject({
      method: 'POST',
      url: '/admin/devotionals',
      headers: { cookie },
      payload: devotionalBody('2020-01-01'),
    });
    await app.inject({
      method: 'POST',
      url: '/admin/devotionals',
      headers: { cookie },
      payload: devotionalBody('2999-12-31'),
    });

    const publish = await app.inject({
      method: 'POST',
      url: '/admin/devotionals/publish',
      headers: { cookie },
    });
    expect(publish.statusCode).toBe(200);
    expect(publish.json<{ published: number }>().published).toBeGreaterThanOrEqual(1);

    const past = await prisma.devotional.findUnique({ where: { date: '2020-01-01' } });
    const future = await prisma.devotional.findUnique({ where: { date: '2999-12-31' } });
    expect(past?.publishedAt).not.toBeNull();
    expect(future?.publishedAt).toBeNull();
  });
});
