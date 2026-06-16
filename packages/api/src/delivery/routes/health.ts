import { type HealthResponse, healthResponseSchema } from '@devocional/shared';
import type { FastifyInstance } from 'fastify';

export function healthRoutes(app: FastifyInstance): void {
  app.get('/health', (): HealthResponse => {
    return healthResponseSchema.parse({ status: 'ok', uptime: process.uptime() });
  });
}
