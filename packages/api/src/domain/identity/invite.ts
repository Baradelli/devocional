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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Regra do convite que trava o e-mail: se o convite foi emitido para um e-mail
 * específico, o cadastro só é aceito naquele e-mail. Convite sem e-mail (`null`)
 * é aberto a qualquer um. Comparação tolerante a caixa/espaços.
 */
export function inviteAllowsEmail(inviteEmail: string | null, candidateEmail: string): boolean {
  if (inviteEmail === null) {
    return true;
  }
  return normalizeEmail(inviteEmail) === normalizeEmail(candidateEmail);
}

/** Só convites ainda pendentes podem ser revogados (cancelados) pelo admin. */
export function canRevokeInvite(status: InviteStatus): boolean {
  return status === 'PENDING';
}
