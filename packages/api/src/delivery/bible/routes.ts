import {
  bookSchema,
  chapterSchema,
  passagePreviewSchema,
  passageReferenceSchema,
  translationSchema,
} from '@devocional/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { BibleModule } from '../../infrastructure/bible/bibleModule.js';
import { requireAdmin } from '../identity/guards.js';

export interface BibleRoutesOptions {
  bible: BibleModule;
}

export const bibleRoutes: FastifyPluginAsync<BibleRoutesOptions> = (app, opts) => {
  const { bible } = opts;
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    '/admin/bible/translations',
    { preHandler: requireAdmin, schema: { response: { 200: z.array(translationSchema) } } },
    () => bible.listTranslations(),
  );

  r.get(
    '/admin/bible/translations/:translationId/books',
    {
      preHandler: requireAdmin,
      schema: {
        params: z.object({ translationId: z.string().min(1) }),
        response: { 200: z.array(bookSchema) },
      },
    },
    (request) => bible.listBooks(request.params.translationId),
  );

  r.get(
    '/admin/bible/books/:bookId/chapters',
    {
      preHandler: requireAdmin,
      schema: {
        params: z.object({ bookId: z.string().min(1) }),
        response: { 200: z.array(chapterSchema) },
      },
    },
    (request) => bible.listChapters(request.params.bookId),
  );

  r.get(
    '/admin/bible/passage',
    {
      preHandler: requireAdmin,
      schema: { querystring: passageReferenceSchema, response: { 200: passagePreviewSchema } },
    },
    (request) => bible.getPassagePreview(request.query),
  );

  return Promise.resolve();
};
