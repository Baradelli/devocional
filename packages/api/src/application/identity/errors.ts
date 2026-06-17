export type IdentityErrorCode =
  | 'INVITE_NOT_FOUND'
  | 'INVITE_EXPIRED'
  | 'INVITE_ALREADY_USED'
  | 'INVITE_REVOKED'
  | 'EMAIL_TAKEN'
  | 'INVALID_CREDENTIALS';

/**
 * Erro de domínio da identidade. Carrega um `code` estável (inglês); a
 * mensagem PT-BR exibida ao fiel é mapeada na camada de delivery.
 */
export class IdentityError extends Error {
  readonly code: IdentityErrorCode;

  constructor(code: IdentityErrorCode) {
    super(code);
    this.name = 'IdentityError';
    this.code = code;
  }
}
