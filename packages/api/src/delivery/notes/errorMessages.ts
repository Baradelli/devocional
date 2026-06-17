import type { NoteErrorCode } from '../../application/notes/errors.js';

interface MappedError {
  status: number;
  message: string;
}

const NOTE_ERROR_RESPONSES: Record<NoteErrorCode, MappedError> = {
  DEVOTIONAL_NOT_FOUND: { status: 404, message: 'Não encontramos o devocional desta anotação.' },
  NOTE_NOT_FOUND: { status: 404, message: 'Você ainda não tem uma anotação para este dia.' },
};

export function noteErrorResponse(code: NoteErrorCode): MappedError {
  return NOTE_ERROR_RESPONSES[code];
}
