import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import type { PrismaClient } from '@prisma/client';
import Fastify, { type FastifyInstance } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import { createBibleModule } from '../infrastructure/bible/bibleModule.js';
import type { Env } from '../infrastructure/config/env.js';
import { createContentModule } from '../infrastructure/content/contentModule.js';
import { createIdentityModule } from '../infrastructure/identity/identityModule.js';
import { createNotesModule } from '../infrastructure/notes/notesModule.js';
import { createNotificationsModule } from '../infrastructure/notifications/notificationsModule.js';
import { createProgressModule } from '../infrastructure/progress/progressModule.js';
import { bibleRoutes } from './bible/routes.js';
import { contentRoutes } from './content/routes.js';
import { identityErrorHandler } from './identity/errorHandler.js';
import { identityRoutes } from './identity/routes.js';
import { notesRoutes } from './notes/routes.js';
import { notificationsRoutes } from './notifications/routes.js';
import { progressRoutes } from './progress/routes.js';
import { healthRoutes } from './routes/health.js';

const MAX_MEDIA_BYTES = 30 * 1024 * 1024; // 30 MB

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

  app.register(cors, { origin: env.CORS_ORIGINS, credentials: true });
  app.register(cookie);
  app.register(multipart, { limits: { fileSize: MAX_MEDIA_BYTES, files: 1 } });

  const identity = createIdentityModule(prisma);
  const progress = createProgressModule(prisma);
  const notes = createNotesModule(prisma);
  const notifications = createNotificationsModule(
    prisma,
    {
      vapid:
        env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY
          ? {
              subject: env.VAPID_SUBJECT,
              publicKey: env.VAPID_PUBLIC_KEY,
              privateKey: env.VAPID_PRIVATE_KEY,
            }
          : null,
      appUrl: env.APP_URL,
    },
    app.log,
  );
  const bible = createBibleModule(prisma);
  const content = createContentModule(prisma, bible, {
    mediaDir: env.MEDIA_DIR,
    serverTimezone: env.SERVER_TIMEZONE,
  });

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
  app.register(notesRoutes, { notes });
  app.register(notificationsRoutes, { notifications });
  app.register(bibleRoutes, { bible });
  app.register(contentRoutes, { content });

  return app;
}
