import { healthResponseSchema } from '@devocional/shared';
import { describe, expect, it } from 'vitest';

// Smoke test: o pacote compartilhado é consumível a partir do admin.
describe('@devocional/shared link', () => {
  it('exposes the health contract schema', () => {
    expect(healthResponseSchema.safeParse({ status: 'ok', uptime: 0 }).success).toBe(true);
  });
});
