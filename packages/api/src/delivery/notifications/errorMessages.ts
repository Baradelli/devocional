import type { NotificationErrorCode } from '../../application/notifications/errors.js';

interface MappedError {
  status: number;
  message: string;
}

const NOTIFICATION_ERROR_RESPONSES: Record<NotificationErrorCode, MappedError> = {
  WHATSAPP_NOT_REGISTERED: {
    status: 404,
    message: 'Cadastre um número de WhatsApp antes de validar.',
  },
  CODE_INVALID: { status: 400, message: 'Código incorreto. Confira e tente novamente.' },
  CODE_EXPIRED: { status: 400, message: 'O código expirou. Peça um novo.' },
  ALREADY_VERIFIED: { status: 409, message: 'Este número já está validado.' },
};

export function notificationErrorResponse(code: NotificationErrorCode): MappedError {
  return NOTIFICATION_ERROR_RESPONSES[code];
}
