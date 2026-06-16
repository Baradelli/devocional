import type { InviteEvaluation } from '../../domain/identity/invite.js';
import type { IdentityErrorCode } from './errors.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * MS_PER_DAY);
}

/** Mapeia o resultado não-utilizável de `evaluateInvite` para o erro de domínio. */
export function inviteErrorCode(
  evaluation: Exclude<InviteEvaluation, 'USABLE'>,
): IdentityErrorCode {
  switch (evaluation) {
    case 'EXPIRED':
      return 'INVITE_EXPIRED';
    case 'ALREADY_USED':
      return 'INVITE_ALREADY_USED';
    case 'REVOKED':
      return 'INVITE_REVOKED';
  }
}

export const DEFAULT_SESSION_TTL_DAYS = 30;
