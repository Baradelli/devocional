import type { ProgressErrorCode } from '../../application/progress/errors.js';

interface MappedError {
  status: number;
  message: string;
}

const PROGRESS_ERROR_RESPONSES: Record<ProgressErrorCode, MappedError> = {
  USER_NOT_FOUND: { status: 404, message: 'Não encontramos sua conta.' },
};

export function progressErrorResponse(code: ProgressErrorCode): MappedError {
  return PROGRESS_ERROR_RESPONSES[code];
}
