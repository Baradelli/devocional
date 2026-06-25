import { describe, expect, it } from 'vitest';

import { canRevokeInvite, evaluateInvite, inviteAllowsEmail, type InviteState } from './invite.js';

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

describe('inviteAllowsEmail', () => {
  it('allows any email when the invite has no bound email (open invite)', () => {
    expect(inviteAllowsEmail(null, 'qualquer@devocional.test')).toBe(true);
  });

  it('allows the bound email when it matches exactly', () => {
    expect(inviteAllowsEmail('ana@devocional.test', 'ana@devocional.test')).toBe(true);
  });

  it('matches the bound email ignoring case and surrounding whitespace', () => {
    expect(inviteAllowsEmail('ana@devocional.test', '  Ana@Devocional.test  ')).toBe(true);
  });

  it('rejects an email that differs from the bound one', () => {
    expect(inviteAllowsEmail('ana@devocional.test', 'bia@devocional.test')).toBe(false);
  });
});

describe('canRevokeInvite', () => {
  it('allows revoking a pending invite', () => {
    expect(canRevokeInvite('PENDING')).toBe(true);
  });

  it('refuses to revoke an already-used invite', () => {
    expect(canRevokeInvite('USED')).toBe(false);
  });

  it('refuses to revoke an already-revoked invite', () => {
    expect(canRevokeInvite('REVOKED')).toBe(false);
  });
});
