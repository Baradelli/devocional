import { z } from 'zod';

import { passageReferenceSchema } from './bible.js';

/**
 * Conteúdo do devocional. O v1 tem uma sequência fixa de blocos
 * (frase → passagem → devocional → oração → reflexão); por isso o payload de
 * criação é estruturado por seção, e o backend o materializa em blocos ordenados.
 */

export const blockTypeSchema = z.enum(['QUOTE', 'PASSAGE', 'DEVOTIONAL', 'PRAYER', 'REFLECTION']);
export type BlockType = z.infer<typeof blockTypeSchema>;

export const mediaTypeSchema = z.enum(['AUDIO', 'GIF', 'SOUND']);
export type MediaType = z.infer<typeof mediaTypeSchema>;

export const mediaViewSchema = z.object({
  id: z.string(),
  type: mediaTypeSchema,
  url: z.string(),
});
export type MediaView = z.infer<typeof mediaViewSchema>;

const mediaIdSchema = z.string().min(1).optional();
const reflectionListSchema = z.array(z.string().trim().min(1)).length(3);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_invalid');

export const createDevotionalSchema = z.object({
  date: isoDate,
  theme: z.string().trim().min(1).optional(),
  quote: z.object({ text: z.string().trim().min(1) }),
  passage: z.object({ reference: passageReferenceSchema, audioMediaId: mediaIdSchema }),
  devotional: z.object({ text: z.string().trim().min(1), audioMediaId: mediaIdSchema }),
  prayer: z.object({
    text: z.string().trim().min(1),
    audioMediaId: mediaIdSchema,
    gifMediaId: mediaIdSchema,
    soundMediaId: mediaIdSchema,
  }),
  reflection: z.object({
    questions: reflectionListSchema,
    actions: reflectionListSchema,
    audioMediaId: mediaIdSchema,
  }),
});
export type CreateDevotionalRequest = z.infer<typeof createDevotionalSchema>;

// --- Visão montada (admin preview e, no M5, a tela do fiel) ---

const baseBlock = { order: z.number().int().nonnegative() };

export const quoteBlockViewSchema = z.object({
  type: z.literal('QUOTE'),
  ...baseBlock,
  text: z.string(),
});

export const passageVerseSchema = z.object({
  verse: z.number().int().positive(),
  text: z.string(),
});
export type PassageVerseView = z.infer<typeof passageVerseSchema>;

export const passageBlockViewSchema = z.object({
  type: z.literal('PASSAGE'),
  ...baseBlock,
  label: z.string(),
  text: z.string(),
  /** Versículos individuais (para a leitura em "stories", um por tela). */
  verses: z.array(passageVerseSchema),
  reference: z.object({
    translationId: z.string(),
    bookReferenceId: z.number().int().positive(),
    chapter: z.number().int().positive(),
    verseStart: z.number().int().positive(),
    verseEnd: z.number().int().positive(),
  }),
  audioUrl: z.string().nullable(),
});

export const devotionalBlockViewSchema = z.object({
  type: z.literal('DEVOTIONAL'),
  ...baseBlock,
  text: z.string(),
  audioUrl: z.string().nullable(),
});

export const prayerBlockViewSchema = z.object({
  type: z.literal('PRAYER'),
  ...baseBlock,
  text: z.string(),
  audioUrl: z.string().nullable(),
  gifUrl: z.string().nullable(),
  soundUrl: z.string().nullable(),
});

export const reflectionBlockViewSchema = z.object({
  type: z.literal('REFLECTION'),
  ...baseBlock,
  questions: z.array(z.string()),
  actions: z.array(z.string()),
  audioUrl: z.string().nullable(),
});

export const blockViewSchema = z.discriminatedUnion('type', [
  quoteBlockViewSchema,
  passageBlockViewSchema,
  devotionalBlockViewSchema,
  prayerBlockViewSchema,
  reflectionBlockViewSchema,
]);
export type BlockView = z.infer<typeof blockViewSchema>;

export const devotionalViewSchema = z.object({
  id: z.string(),
  date: z.string(),
  theme: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
  blocks: z.array(blockViewSchema),
});
export type DevotionalView = z.infer<typeof devotionalViewSchema>;

export const devotionalSummarySchema = z.object({
  date: z.string(),
  theme: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
});
export type DevotionalSummary = z.infer<typeof devotionalSummarySchema>;
