import { createReadStream } from 'node:fs';

import {
  createDevotionalSchema,
  devotionalSummarySchema,
  devotionalViewSchema,
  mediaTypeSchema,
  mediaViewSchema,
} from '@devocional/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { ContentModule } from '../../infrastructure/content/contentModule.js';
import { requireAdmin, requireAuth } from '../identity/guards.js';

export interface ContentRoutesOptions {
  content: ContentModule;
}

const dateParamsSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export const contentRoutes: FastifyPluginAsync<ContentRoutesOptions> = (app, opts) => {
  const { content } = opts;
  const r = app.withTypeProvider<ZodTypeProvider>();

  // Tela "Hoje" do fiel: devocional publicado do dia lógico do usuário.
  r.get(
    '/devotionals/today',
    { preHandler: requireAuth, schema: { response: { 200: devotionalViewSchema } } },
    (request) => content.getTodayDevotional(request.currentUser!.timezone),
  );

  r.post(
    '/admin/devotionals',
    {
      preHandler: requireAdmin,
      schema: { body: createDevotionalSchema, response: { 201: devotionalSummarySchema } },
    },
    async (request, reply) => {
      await content.createDevotional(request.body);
      return reply
        .status(201)
        .send({ date: request.body.date, theme: request.body.theme ?? null, publishedAt: null });
    },
  );

  r.get(
    '/admin/devotionals',
    { preHandler: requireAdmin, schema: { response: { 200: z.array(devotionalSummarySchema) } } },
    () => content.listDevotionals(),
  );

  r.get(
    '/admin/devotionals/:date',
    {
      preHandler: requireAdmin,
      schema: { params: dateParamsSchema, response: { 200: devotionalViewSchema } },
    },
    (request) => content.getDevotionalForDate(request.params.date),
  );

  r.post(
    '/admin/devotionals/publish',
    {
      preHandler: requireAdmin,
      schema: { response: { 200: z.object({ published: z.number().int() }) } },
    },
    async () => ({ published: await content.publishDue() }),
  );

  r.post(
    '/admin/media',
    {
      preHandler: requireAdmin,
      schema: {
        querystring: z.object({ type: mediaTypeSchema }),
        response: {
          201: mediaViewSchema,
          400: z.object({ error: z.string(), message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ error: 'NO_FILE', message: 'Envie um arquivo.' });
      }
      const data = await file.toBuffer();
      const media = await content.uploadMedia({
        type: request.query.type,
        data,
        mimetype: file.mimetype,
        originalName: file.filename || null,
      });
      return reply.status(201).send({ id: media.id, type: media.type, url: `/media/${media.id}` });
    },
  );

  // Servir mídia (qualquer usuário autenticado; fortemente cacheável e imutável).
  r.get(
    '/media/:id',
    { preHandler: requireAuth, schema: { params: z.object({ id: z.string().min(1) }) } },
    async (request, reply) => {
      const { media, absolutePath } = await content.resolveMediaForServe(request.params.id);
      return reply
        .header('cache-control', 'public, max-age=31536000, immutable')
        .type(media.mimetype)
        .send(createReadStream(absolutePath));
    },
  );

  return Promise.resolve();
};
