import { z } from 'zod';

import { idempotencyKeySchema } from './progress.js';

/**
 * Schemas de anotações. A anotação é privada ao dono e atrelada a um devocional
 * (no máximo uma por dia). Escrita offline + sync idempotente: cada operação
 * carrega `idempotencyKey` e `editedAt`; o servidor reconcilia por last-write-wins
 * (ver docs/design.md, regra de domínio das anotações). Sem mensagens PT-BR aqui.
 */

export const noteTextSchema = z.string().max(10_000);

/** Uma operação de anotação enfileirada no device (escrita ou remoção). */
export const noteOperationSchema = z.object({
  devotionalId: z.string().min(1),
  idempotencyKey: idempotencyKeySchema,
  editedAt: z.string().datetime(),
  text: noteTextSchema,
  deleted: z.boolean().default(false),
});
export type NoteOperation = z.infer<typeof noteOperationSchema>;

/** Salvar/editar a anotação do dia (online, otimista). */
export const saveNoteSchema = z.object({
  devotionalId: z.string().min(1),
  idempotencyKey: idempotencyKeySchema,
  editedAt: z.string().datetime(),
  text: noteTextSchema,
});
export type SaveNoteInput = z.infer<typeof saveNoteSchema>;

/** Remover (soft delete) a anotação do dia. */
export const deleteNoteSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
  editedAt: z.string().datetime(),
});
export type DeleteNoteInput = z.infer<typeof deleteNoteSchema>;

/** Fila offline de operações para reconciliar ao reconectar. */
export const syncNotesRequestSchema = z.object({
  operations: z.array(noteOperationSchema).min(1).max(100),
});
export type SyncNotesRequest = z.infer<typeof syncNotesRequestSchema>;

export const noteViewSchema = z.object({
  devotionalId: z.string(),
  date: z.string(),
  text: z.string(),
  editedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type NoteView = z.infer<typeof noteViewSchema>;

/** Biblioteca pessoal: as próprias anotações ativas, por data. */
export const noteListSchema = z.object({ notes: z.array(noteViewSchema) });
export type NoteList = z.infer<typeof noteListSchema>;

export const noteOkSchema = z.object({ ok: z.boolean() });
