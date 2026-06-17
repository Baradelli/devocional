import { z } from 'zod';

/**
 * Schemas da base bíblica e do seletor de passagem. A passagem é uma
 * REFERÊNCIA canônica (translationId + bookReferenceId + chapter + range), nunca
 * texto copiado (ADR-006). O texto é montado da tabela `Verse` na exibição.
 */

export const translationSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
});
export type Translation = z.infer<typeof translationSchema>;

export const bookSchema = z.object({
  id: z.string(),
  bookReferenceId: z.number().int().positive(),
  testamentReferenceId: z.number().int().positive(),
  name: z.string(),
});
export type Book = z.infer<typeof bookSchema>;

export const chapterSchema = z.object({
  chapter: z.number().int().positive(),
  verseCount: z.number().int().nonnegative(),
});
export type Chapter = z.infer<typeof chapterSchema>;

export const verseSchema = z.object({
  verse: z.number().int().positive(),
  text: z.string(),
});
export type Verse = z.infer<typeof verseSchema>;

export const passageReferenceSchema = z
  .object({
    translationId: z.string().min(1),
    bookReferenceId: z.coerce.number().int().positive(),
    chapter: z.coerce.number().int().positive(),
    verseStart: z.coerce.number().int().positive(),
    verseEnd: z.coerce.number().int().positive(),
  })
  .refine((ref) => ref.verseEnd >= ref.verseStart, {
    message: 'verse_range_invalid',
    path: ['verseEnd'],
  });
export type PassageReference = z.infer<typeof passageReferenceSchema>;

export const passagePreviewSchema = z.object({
  reference: z.object({
    translationId: z.string(),
    bookReferenceId: z.number().int().positive(),
    chapter: z.number().int().positive(),
    verseStart: z.number().int().positive(),
    verseEnd: z.number().int().positive(),
  }),
  label: z.string(),
  bookName: z.string(),
  verses: z.array(verseSchema),
  text: z.string(),
});
export type PassagePreview = z.infer<typeof passagePreviewSchema>;
