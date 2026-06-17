export type VerificationOutcome = 'OK' | 'INVALID' | 'EXPIRED';

export interface VerificationState {
  code: string | null;
  expiresAt: Date | null;
}

/**
 * Avalia um código de verificação de WhatsApp. Puro: o código só vale se bate
 * exatamente e ainda não expirou. Sem código pendente → inválido.
 */
export function checkVerificationCode(
  state: VerificationState,
  provided: string,
  now: Date,
): VerificationOutcome {
  if (!state.code || !state.expiresAt) {
    return 'INVALID';
  }
  if (state.code !== provided) {
    return 'INVALID';
  }
  if (now.getTime() > state.expiresAt.getTime()) {
    return 'EXPIRED';
  }
  return 'OK';
}
