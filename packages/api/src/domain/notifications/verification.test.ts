import { describe, expect, it } from 'vitest';

import { checkVerificationCode } from './verification.js';

const expiresAt = new Date('2026-06-17T10:15:00Z');

describe('checkVerificationCode', () => {
  it('accepts the right code before expiry', () => {
    const now = new Date('2026-06-17T10:05:00Z');
    expect(checkVerificationCode({ code: '4821', expiresAt }, '4821', now)).toBe('OK');
  });

  it('rejects a wrong code', () => {
    const now = new Date('2026-06-17T10:05:00Z');
    expect(checkVerificationCode({ code: '4821', expiresAt }, '0000', now)).toBe('INVALID');
  });

  it('rejects when there is no pending code', () => {
    const now = new Date('2026-06-17T10:05:00Z');
    expect(checkVerificationCode({ code: null, expiresAt: null }, '4821', now)).toBe('INVALID');
  });

  it('reports an expired code', () => {
    const now = new Date('2026-06-17T10:20:00Z');
    expect(checkVerificationCode({ code: '4821', expiresAt }, '4821', now)).toBe('EXPIRED');
  });
});
