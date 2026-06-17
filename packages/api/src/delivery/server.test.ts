import { healthResponseSchema } from '@devocional/shared';
import { describe, expect, it } from 'vitest';

import type { Env } from '../infrastructure/config/env.js';
import { createPrismaClient } from '../infrastructure/prisma/client.js';
import { buildServer } from './server.js';

const env: Env = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://localhost:5432/devocional_test',
  PORT: 3000,
  COOKIE_NAME: 'devocional_session',
  MEDIA_DIR: 'media-storage-test',
  SERVER_TIMEZONE: 'America/Sao_Paulo',
  VAPID_SUBJECT: 'mailto:test@devocional.app',
  APP_URL: 'http://localhost:5173',
  CORS_ORIGINS: [],
};

describe('GET /health', () => {
  it('returns a 200 with a payload matching the shared contract', async () => {
    // O healthcheck não toca o banco; o client nem chega a conectar.
    const prisma = createPrismaClient(env.DATABASE_URL);
    const app = buildServer({ prisma, env, logger: false });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.safeParse(response.json()).success).toBe(true);

    await app.close();
    await prisma.$disconnect();
  });
});
