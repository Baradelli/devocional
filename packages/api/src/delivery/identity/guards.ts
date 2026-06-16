import type { preHandlerAsyncHookHandler } from 'fastify';

import type { UserRecord } from '../../application/identity/ports.js';

declare module 'fastify' {
  interface FastifyRequest {
    // Resolvido pelo hook onRequest a partir do cookie de sessão.
    currentUser: UserRecord | null;
  }
}

export const requireAuth: preHandlerAsyncHookHandler = async (request, reply) => {
  if (!request.currentUser) {
    await reply
      .status(401)
      .send({ error: 'UNAUTHENTICATED', message: 'Faça login para continuar.' });
  }
};

export const requireAdmin: preHandlerAsyncHookHandler = async (request, reply) => {
  if (!request.currentUser) {
    await reply
      .status(401)
      .send({ error: 'UNAUTHENTICATED', message: 'Faça login para continuar.' });
    return;
  }
  if (request.currentUser.role !== 'ADMIN') {
    await reply
      .status(403)
      .send({ error: 'FORBIDDEN', message: 'Acesso restrito ao administrador.' });
  }
};
