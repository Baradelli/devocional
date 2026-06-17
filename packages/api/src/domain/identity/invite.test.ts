import { describe, expect, it } from 'vitest';

import { evaluateInvite, type InviteState } from './invite.js';

const future = new Date('2026-06-20T00:00:00.000Z');
const now = new Date('2026-06-16T12:00:00.000Z');
const past = new Date('2026-06-10T00:00:00.000Z');

function invite(overrides: Partial<InviteState> = {}): InviteState {
  return { status: 'PENDING', expiresAt: future, ...overrides };
}

describe('evaluateInvite', () => {
  it('is USABLE when pending and not yet expired', () => {
    expect(evaluateInvite(invite(), now)).toBe('USABLE');
  });

  it('is EXPIRED when pending but past the expiry instant', () => {
    expect(evaluateInvite(invite({ expiresAt: past }), now)).toBe('EXPIRED');
  });

  it('treats the exact expiry instant as EXPIRED', () => {
    expect(evaluateInvite(invite({ expiresAt: now }), now)).toBe('EXPIRED');
  });

  it('is ALREADY_USED when consumed, regardless of expiry', () => {
    expect(evaluateInvite(invite({ status: 'USED' }), now)).toBe('ALREADY_USED');
  });

  it('is REVOKED when revoked, regardless of expiry', () => {
    expect(evaluateInvite(invite({ status: 'REVOKED' }), now)).toBe('REVOKED');
  });

  it('prioritises a terminal status over expiry', () => {
    expect(evaluateInvite(invite({ status: 'USED', expiresAt: past }), now)).toBe('ALREADY_USED');
  });
});
