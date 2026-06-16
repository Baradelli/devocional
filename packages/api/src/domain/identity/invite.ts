export type InviteStatus = 'PENDING' | 'USED' | 'REVOKED';

export interface InviteState {
  status: InviteStatus;
  expiresAt: Date;
}

export type InviteEvaluation = 'USABLE' | 'EXPIRED' | 'ALREADY_USED' | 'REVOKED';

/**
 * Regra pura de usabilidade do convite. O status terminal (usado/revogado)
 * tem precedência sobre a expiração. A expiração é exclusiva no instante
 * exato (expiresAt <= now ⇒ expirado).
 */
export function evaluateInvite(invite: InviteState, now: Date): InviteEvaluation {
  if (invite.status === 'USED') {
    return 'ALREADY_USED';
  }
  if (invite.status === 'REVOKED') {
    return 'REVOKED';
  }
  if (invite.expiresAt.getTime() <= now.getTime()) {
    return 'EXPIRED';
  }
  return 'USABLE';
}
