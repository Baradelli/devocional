import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod';

import { BibleError } from '../../application/bible/errors.js';
import { ContentError } from '../../application/content/errors.js';
import { IdentityError } from '../../application/identity/errors.js';
import { NoteError } from '../../application/notes/errors.js';
import { ProgressError } from '../../application/progress/errors.js';
import { bibleErrorResponse } from '../bible/errorMessages.js';
import { contentErrorResponse } from '../content/errorMessages.js';
import { noteErrorResponse } from '../notes/errorMessages.js';
import { progressErrorResponse } from '../progress/errorMessages.js';
import { identityErrorResponse } from './errorMessages.js';

/**
 * Tratamento centralizado de erros da borda HTTP. Traduz IdentityError e erros
 * de validação Zod para respostas com mensagem PT-BR; o resto vira 500 logado.
 */
export function identityErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof IdentityError) {
    const mapped = identityErrorResponse(error.code);
    void reply.status(mapped.status).send({ error: error.code, message: mapped.message });
    return;
  }

  if (error instanceof ProgressError) {
    const mapped = progressErrorResponse(error.code);
    void reply.status(mapped.status).send({ error: error.code, message: mapped.message });
    return;
  }

  if (error instanceof BibleError) {
    const mapped = bibleErrorResponse(error.code);
    void reply.status(mapped.status).send({ error: error.code, message: mapped.message });
    return;
  }

  if (error instanceof ContentError) {
    const mapped = contentErrorResponse(error.code);
    void reply.status(mapped.status).send({ error: error.code, message: mapped.message });
    return;
  }

  if (error instanceof NoteError) {
    const mapped = noteErrorResponse(error.code);
    void reply.status(mapped.status).send({ error: error.code, message: mapped.message });
    return;
  }

  if (hasZodFastifySchemaValidationErrors(error)) {
    void reply
      .status(400)
      .send({ error: 'VALIDATION', message: 'Dados inválidos.', issues: error.validation });
    return;
  }

  if (isResponseSerializationError(error)) {
    request.log.error(error, 'response serialization error');
    void reply.status(500).send({ error: 'INTERNAL', message: 'Algo deu errado.' });
    return;
  }

  if (typeof error.statusCode === 'number' && error.statusCode < 500) {
    void reply.status(error.statusCode).send({ error: error.code, message: error.message });
    return;
  }

  request.log.error(error);
  void reply.status(500).send({ error: 'INTERNAL', message: 'Algo deu errado.' });
}
