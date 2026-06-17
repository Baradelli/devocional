import Fastify, { type FastifyInstance } from 'fastify';

import { healthRoutes } from './routes/health.js';

export interface BuildServerOptions {
  logger?: boolean;
}

export function buildServer({ logger = true }: BuildServerOptions = {}): FastifyInstance {
  const app = Fastify({ logger });

  app.register(healthRoutes);

  return app;
}
