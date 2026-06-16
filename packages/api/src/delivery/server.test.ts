import { healthResponseSchema } from '@devocional/shared';
import { describe, expect, it } from 'vitest';

import { buildServer } from './server.js';

describe('GET /health', () => {
  it('returns a 200 with a payload matching the shared contract', async () => {
    const app = buildServer({ logger: false });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.safeParse(response.json()).success).toBe(true);

    await app.close();
  });
});
