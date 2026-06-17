import { describe, expect, it } from 'vitest';

import { healthResponseSchema } from './health.js';

describe('healthResponseSchema', () => {
  it('accepts a well-formed health payload', () => {
    const parsed = healthResponseSchema.parse({ status: 'ok', uptime: 12.5 });

    expect(parsed).toEqual({ status: 'ok', uptime: 12.5 });
  });

  it('rejects a non-"ok" status', () => {
    const result = healthResponseSchema.safeParse({ status: 'down', uptime: 1 });

    expect(result.success).toBe(false);
  });

  it('rejects a negative uptime', () => {
    const result = healthResponseSchema.safeParse({ status: 'ok', uptime: -1 });

    expect(result.success).toBe(false);
  });
});
