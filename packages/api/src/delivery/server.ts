import cookie from '@fastify/cookie';
import type { PrismaClient } from '@prisma/client';
import Fastify, { type FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import type { Env } from '../infrastructure/config/env.js';
import { createIdentityModule } from '../infrastructure/identity/identityModule.js';
import { createProgressModule } from '../infrastructure/progress/progressModule.js';
import { identityErrorHandler } from './identity/errorHandler.js';
import { identityRoutes } from './identity/routes.js';
import { progressRoutes } from './progress/routes.js';
import { healthRoutes } from './routes/health.js';

export interface BuildServerOptions {
  prisma: PrismaClient;
  env: Env;
  logger?: boolean;
}

export function buildServer({ prisma, env, logger = true }: BuildServerOptions): FastifyInstance {
  const app = Fastify({ logger });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(identityErrorHandler);

  app.register(cookie);

  const identity = createIdentityModule(prisma);
  const progress = createProgressModule(prisma);

  // Contexto de autenticação compartilhado por todas as rotas: resolve o
  // usuário atual a partir do cookie de sessão (autoridade do servidor).
  app.decorateRequest('currentUser', null);
  app.addHook('onRequest', async (request) => {
    const token = request.cookies[env.COOKIE_NAME];
    request.currentUser = token ? await identity.authenticate(token) : null;
  });

  app.register(healthRoutes);
  app.register(identityRoutes, { identity, env });
  app.register(progressRoutes, { progress });

  return app;
}
