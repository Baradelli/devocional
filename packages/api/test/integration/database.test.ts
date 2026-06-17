import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import type { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPrismaClient } from '../../src/infrastructure/prisma/client.js';

const apiRoot = fileURLToPath(new URL('../../', import.meta.url));

describe('database integration (Postgres real via Testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    const databaseUrl = container.getConnectionUri();

    // Aplica a(s) migration(s) contra o banco efêmero — exercita o pipeline real.
    execSync('pnpm exec prisma migrate deploy', {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    });

    prisma = createPrismaClient(databaseUrl);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await container?.stop();
  });

  it('connects and runs a query', async () => {
    const rows = await prisma.$queryRaw<{ one: number }[]>`SELECT 1 as one`;

    expect(rows).toEqual([{ one: 1 }]);
  });

  it('recorded the initial migration', async () => {
    const rows = await prisma.$queryRaw<
      { count: number }[]
    >`SELECT count(*)::int as count FROM _prisma_migrations`;

    expect(rows[0]?.count).toBeGreaterThanOrEqual(1);
  });
});
