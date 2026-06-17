export type ProgressErrorCode = 'USER_NOT_FOUND';

export class ProgressError extends Error {
  readonly code: ProgressErrorCode;

  constructor(code: ProgressErrorCode) {
    super(code);
    this.name = 'ProgressError';
    this.code = code;
  }
}
