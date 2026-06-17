export type NotificationErrorCode =
  | 'WHATSAPP_NOT_REGISTERED'
  | 'CODE_INVALID'
  | 'CODE_EXPIRED'
  | 'ALREADY_VERIFIED';

export class NotificationError extends Error {
  readonly code: NotificationErrorCode;

  constructor(code: NotificationErrorCode) {
    super(code);
    this.name = 'NotificationError';
    this.code = code;
  }
}
