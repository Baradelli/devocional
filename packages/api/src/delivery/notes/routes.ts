import {
  deleteNoteSchema,
  noteListSchema,
  noteOkSchema,
  noteViewSchema,
  saveNoteSchema,
  syncNotesRequestSchema,
} from '@devocional/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { NotesModule } from '../../infrastructure/notes/notesModule.js';
import { requireAuth } from '../identity/guards.js';
import { toNoteList, toNoteView } from './serializers.js';

export interface NotesRoutesOptions {
  notes: NotesModule;
}

const devotionalParams = z.object({ devotionalId: z.string().min(1) });

export const notesRoutes: FastifyPluginAsync<NotesRoutesOptions> = (app, opts) => {
  const { notes } = opts;
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    '/notes',
    { preHandler: requireAuth, schema: { response: { 200: noteListSchema } } },
    async (request) => toNoteList(await notes.list(request.currentUser!.id)),
  );

  r.get(
    '/notes/by-devotional/:devotionalId',
    {
      preHandler: requireAuth,
      schema: { params: devotionalParams, response: { 200: noteViewSchema } },
    },
    async (request) =>
      toNoteView(await notes.get(request.currentUser!.id, request.params.devotionalId)),
  );

  r.put(
    '/notes',
    {
      preHandler: requireAuth,
      schema: { body: saveNoteSchema, response: { 200: noteViewSchema } },
    },
    async (request) => {
      const body = request.body;
      const note = await notes.apply({
        userId: request.currentUser!.id,
        devotionalId: body.devotionalId,
        text: body.text,
        deleted: false,
        editedAt: new Date(body.editedAt),
        idempotencyKey: body.idempotencyKey,
      });
      return toNoteView(note);
    },
  );

  r.delete(
    '/notes/by-devotional/:devotionalId',
    {
      preHandler: requireAuth,
      schema: { params: devotionalParams, body: deleteNoteSchema, response: { 200: noteOkSchema } },
    },
    async (request) => {
      const body = request.body;
      await notes.apply({
        userId: request.currentUser!.id,
        devotionalId: request.params.devotionalId,
        text: '',
        deleted: true,
        editedAt: new Date(body.editedAt),
        idempotencyKey: body.idempotencyKey,
      });
      return { ok: true };
    },
  );

  r.post(
    '/notes/sync',
    {
      preHandler: requireAuth,
      schema: { body: syncNotesRequestSchema, response: { 200: noteListSchema } },
    },
    async (request) => {
      const notesAfter = await notes.sync({
        userId: request.currentUser!.id,
        operations: request.body.operations.map((op) => ({
          devotionalId: op.devotionalId,
          text: op.text,
          deleted: op.deleted,
          editedAt: new Date(op.editedAt),
          idempotencyKey: op.idempotencyKey,
        })),
      });
      return toNoteList(notesAfter);
    },
  );

  return Promise.resolve();
};
