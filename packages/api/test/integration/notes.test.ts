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

interface NoteBody {
  devotionalId: string;
  date: string;
  text: string;
  editedAt: string;
}
interface NoteListBody {
  notes: NoteBody[];
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

async function createDevotional(date: string): Promise<string> {
  const row = await prisma.devotional.create({ data: { date } });
  return row.id;
}

function save(cookie: string, body: Record<string, unknown>) {
  return app.inject({ method: 'PUT', url: '/notes', headers: { cookie }, payload: body });
}

describe('notes: CRUD offline-capable (private, idempotent, last-write-wins)', () => {
  it('creates, edits, ignores stale/replayed writes, and soft-deletes', async () => {
    await createMember('na@devocional.test');
    const cookie = await loginAs('na@devocional.test');
    const devotionalId = await createDevotional('2026-06-17');

    // Cria a anotação do dia.
    const created = await save(cookie, {
      devotionalId,
      text: 'Primeira anotação.',
      editedAt: '2026-06-17T10:00:00Z',
      idempotencyKey: 'na-1',
    });
    expect(created.statusCode).toBe(200);
    expect(created.json<NoteBody>().text).toBe('Primeira anotação.');

    // Edição mais recente vence.
    const edited = await save(cookie, {
      devotionalId,
      text: 'Anotação revisada.',
      editedAt: '2026-06-17T11:00:00Z',
      idempotencyKey: 'na-2',
    });
    expect(edited.json<NoteBody>().text).toBe('Anotação revisada.');

    // Reenvio idempotente (mesma chave) não muda nada, mesmo com texto diferente.
    const replay = await save(cookie, {
      devotionalId,
      text: 'NÃO deve sobrescrever.',
      editedAt: '2026-06-17T12:00:00Z',
      idempotencyKey: 'na-2',
    });
    expect(replay.json<NoteBody>().text).toBe('Anotação revisada.');

    // Edição stale (mais antiga) é ignorada.
    const stale = await save(cookie, {
      devotionalId,
      text: 'Versão antiga atrasada.',
      editedAt: '2026-06-17T09:00:00Z',
      idempotencyKey: 'na-old',
    });
    expect(stale.json<NoteBody>().text).toBe('Anotação revisada.');

    // GET por devocional devolve a anotação ativa.
    const get = await app.inject({
      method: 'GET',
      url: `/notes/by-devotional/${devotionalId}`,
      headers: { cookie },
    });
    expect(get.statusCode).toBe(200);
    expect(get.json<NoteBody>().text).toBe('Anotação revisada.');

    // Soft delete.
    const removed = await app.inject({
      method: 'DELETE',
      url: `/notes/by-devotional/${devotionalId}`,
      headers: { cookie },
      payload: { editedAt: '2026-06-17T13:00:00Z', idempotencyKey: 'na-del' },
    });
    expect(removed.statusCode).toBe(200);

    // Após remover: GET 404 e biblioteca vazia.
    const afterDelete = await app.inject({
      method: 'GET',
      url: `/notes/by-devotional/${devotionalId}`,
      headers: { cookie },
    });
    expect(afterDelete.statusCode).toBe(404);

    const library = await app.inject({ method: 'GET', url: '/notes', headers: { cookie } });
    expect(library.json<NoteListBody>().notes).toEqual([]);

    // Sem duplicação física: continua uma única linha (soft delete).
    const rows = await prisma.note.count({ where: { user: { email: 'na@devocional.test' } } });
    expect(rows).toBe(1);
  });
});

describe('notes: offline sync + personal library by date', () => {
  it('reconciles a shuffled queue (LWW) and lists active notes by date', async () => {
    await createMember('nb@devocional.test');
    const cookie = await loginAs('nb@devocional.test');
    const day16 = await createDevotional('2026-06-16');
    const day15 = await createDevotional('2026-06-15');

    // Fila offline embaralhada: duas edições do dia 16 (a mais nova vence) e uma do 15.
    const operations = [
      {
        devotionalId: day16,
        text: 'rascunho 16',
        editedAt: '2026-06-16T08:00:00Z',
        idempotencyKey: 'nb-16a',
        deleted: false,
      },
      {
        devotionalId: day15,
        text: 'anotação 15',
        editedAt: '2026-06-15T20:00:00Z',
        idempotencyKey: 'nb-15',
        deleted: false,
      },
      {
        devotionalId: day16,
        text: 'final 16',
        editedAt: '2026-06-16T21:00:00Z',
        idempotencyKey: 'nb-16b',
        deleted: false,
      },
    ];

    const sync = await app.inject({
      method: 'POST',
      url: '/notes/sync',
      headers: { cookie },
      payload: { operations },
    });
    expect(sync.statusCode).toBe(200);
    const list = sync.json<NoteListBody>().notes;

    // Biblioteca ordenada por data desc; dia 16 com o texto da edição mais recente.
    expect(list.map((n) => n.date)).toEqual(['2026-06-16', '2026-06-15']);
    expect(list.find((n) => n.date === '2026-06-16')?.text).toBe('final 16');

    // Re-sync da mesma fila é idempotente: estado idêntico.
    const resync = await app.inject({
      method: 'POST',
      url: '/notes/sync',
      headers: { cookie },
      payload: { operations },
    });
    const relist = resync.json<NoteListBody>().notes;
    expect(relist.find((n) => n.date === '2026-06-16')?.text).toBe('final 16');
    expect(relist).toHaveLength(2);
  });

  it('keeps notes private to their owner', async () => {
    await createMember('owner@devocional.test');
    await createMember('intruder@devocional.test');
    const ownerCookie = await loginAs('owner@devocional.test');
    const intruderCookie = await loginAs('intruder@devocional.test');
    const devotionalId = await createDevotional('2026-06-14');

    await save(ownerCookie, {
      devotionalId,
      text: 'Anotação secreta.',
      editedAt: '2026-06-14T10:00:00Z',
      idempotencyKey: 'priv-1',
    });

    // O intruso não vê a anotação do dono.
    const intruderLibrary = await app.inject({
      method: 'GET',
      url: '/notes',
      headers: { cookie: intruderCookie },
    });
    expect(intruderLibrary.json<NoteListBody>().notes).toEqual([]);

    const intruderGet = await app.inject({
      method: 'GET',
      url: `/notes/by-devotional/${devotionalId}`,
      headers: { cookie: intruderCookie },
    });
    expect(intruderGet.statusCode).toBe(404);
  });
});
