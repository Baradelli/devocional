import type { ContentErrorCode } from '../../application/content/errors.js';

interface MappedError {
  status: number;
  message: string;
}

const CONTENT_ERROR_RESPONSES: Record<ContentErrorCode, MappedError> = {
  DEVOTIONAL_EXISTS: { status: 409, message: 'Já existe um devocional para essa data.' },
  DEVOTIONAL_NOT_FOUND: { status: 404, message: 'Não há devocional para essa data.' },
  PASSAGE_UNAVAILABLE: {
    status: 422,
    message: 'A passagem selecionada não pôde ser montada. Verifique a tradução e o intervalo.',
  },
  MEDIA_NOT_FOUND: { status: 404, message: 'Mídia não encontrada.' },
};

export function contentErrorResponse(code: ContentErrorCode): MappedError {
  return CONTENT_ERROR_RESPONSES[code];
}
