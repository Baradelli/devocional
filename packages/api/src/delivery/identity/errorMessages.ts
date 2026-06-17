import type { IdentityErrorCode } from '../../application/identity/errors.js';

interface MappedError {
  status: number;
  message: string;
}

/**
 * Mapeia o código (inglês, estável) para status HTTP + mensagem PT-BR exibida
 * ao fiel. As strings PT-BR vivem só aqui, na borda — nunca no domínio/schema.
 */
const IDENTITY_ERROR_RESPONSES: Record<IdentityErrorCode, MappedError> = {
  INVITE_NOT_FOUND: { status: 404, message: 'Convite não encontrado.' },
  INVITE_EXPIRED: { status: 410, message: 'Este convite expirou.' },
  INVITE_ALREADY_USED: { status: 409, message: 'Este convite já foi usado.' },
  INVITE_REVOKED: { status: 410, message: 'Este convite foi revogado.' },
  EMAIL_TAKEN: { status: 409, message: 'Já existe uma conta com este e-mail.' },
  INVALID_CREDENTIALS: { status: 401, message: 'E-mail ou senha incorretos.' },
  CANNOT_DELETE_ADMIN: {
    status: 403,
    message: 'A conta de administrador não pode ser excluída por aqui.',
  },
};

export function identityErrorResponse(code: IdentityErrorCode): MappedError {
  return IDENTITY_ERROR_RESPONSES[code];
}
