import type { BibleErrorCode } from '../../application/bible/errors.js';

interface MappedError {
  status: number;
  message: string;
}

const BIBLE_ERROR_RESPONSES: Record<BibleErrorCode, MappedError> = {
  BOOK_NOT_FOUND: { status: 404, message: 'Livro não encontrado nesta tradução.' },
  PASSAGE_EMPTY: { status: 404, message: 'Nenhum versículo encontrado para esse intervalo.' },
};

export function bibleErrorResponse(code: BibleErrorCode): MappedError {
  return BIBLE_ERROR_RESPONSES[code];
}
