import {
  calendarQuerySchema,
  calendarViewSchema,
  completionInputSchema,
  progressSnapshotSchema,
  progressViewSchema,
  syncRequestSchema,
} from '@devocional/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import type { ProgressModule } from '../../infrastructure/progress/progressModule.js';
import { requireAuth } from '../identity/guards.js';
import { toProgressView, toSnapshotView } from './serializers.js';

export interface ProgressRoutesOptions {
  progress: ProgressModule;
}

export const progressRoutes: FastifyPluginAsync<ProgressRoutesOptions> = (app, opts) => {
  const { progress } = opts;
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    '/progress/complete',
    {
      preHandler: requireAuth,
      schema: { body: completionInputSchema, response: { 200: progressSnapshotSchema } },
    },
    async (request) => {
      const body = request.body;
      const snapshot = await progress.complete({
        userId: request.currentUser!.id,
        completedAt: new Date(body.completedAt),
        idempotencyKey: body.idempotencyKey,
        devotionalId: body.devotionalId ?? null,
      });
      return toSnapshotView(snapshot);
    },
  );

  r.post(
    '/progress/sync',
    {
      preHandler: requireAuth,
      schema: { body: syncRequestSchema, response: { 200: progressSnapshotSchema } },
    },
    async (request) => {
      const snapshot = await progress.sync({
        userId: request.currentUser!.id,
        completions: request.body.completions.map((completion) => ({
          completedAt: new Date(completion.completedAt),
          idempotencyKey: completion.idempotencyKey,
          devotionalId: completion.devotionalId ?? null,
        })),
      });
      return toSnapshotView(snapshot);
    },
  );

  r.get(
    '/progress',
    { preHandler: requireAuth, schema: { response: { 200: progressViewSchema } } },
    async (request) => {
      const view = await progress.getProgress(request.currentUser!.id);
      return toProgressView(view);
    },
  );

  r.get(
    '/progress/calendar',
    {
      preHandler: requireAuth,
      schema: { querystring: calendarQuerySchema, response: { 200: calendarViewSchema } },
    },
    (request) => progress.getCalendar(request.currentUser!.id, request.query.month),
  );

  return Promise.resolve();
};
