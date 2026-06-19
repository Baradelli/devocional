import { z } from 'zod';

/**
 * Estatísticas do admin (dashboards). Sem mensagens PT-BR aqui — só dados.
 * Grupo A (cobertura): sobre as referências de passagem dos devocionais,
 * medidas contra a tradução-régua (ACF). Dedup por (livro, capítulo, versículo).
 */

export const testamentSchema = z.enum(['OLD', 'NEW']);
export type Testament = z.infer<typeof testamentSchema>;

export const sectionKeySchema = z.enum([
  'PENTATEUCH',
  'HISTORICAL',
  'POETIC',
  'PROPHETS',
  'GOSPELS',
  'EPISTLES',
  'REVELATION',
]);
export type SectionKey = z.infer<typeof sectionKeySchema>;

const chapterCoverageSchema = z.object({
  chapter: z.number().int().positive(),
  totalVerses: z.number().int().nonnegative(),
  coveredVerses: z.number().int().nonnegative(),
  citations: z.number().int().nonnegative(),
});

const bookCoverageSchema = z.object({
  bookReferenceId: z.number().int().positive(),
  name: z.string(),
  testament: testamentSchema,
  totalVerses: z.number().int().nonnegative(),
  coveredVerses: z.number().int().nonnegative(),
  citations: z.number().int().nonnegative(),
  chapters: z.array(chapterCoverageSchema),
});

const groupCoverageSchema = z.object({
  coveredVerses: z.number().int().nonnegative(),
  totalVerses: z.number().int().nonnegative(),
  devotionalCount: z.number().int().nonnegative(),
});

export const coverageStatsSchema = z.object({
  rulerTranslationCode: z.string(),
  totalVerses: z.number().int().nonnegative(),
  coveredVerses: z.number().int().nonnegative(),
  coveragePct: z.number().min(0).max(100),
  devotionalCount: z.number().int().nonnegative(),
  testaments: z.object({ OLD: groupCoverageSchema, NEW: groupCoverageSchema }),
  sections: z.array(
    z.object({
      key: sectionKeySchema,
      coveredVerses: z.number().int().nonnegative(),
      totalVerses: z.number().int().nonnegative(),
      devotionalCount: z.number().int().nonnegative(),
    }),
  ),
  books: z.array(bookCoverageSchema),
  topBooks: z.array(
    z.object({
      bookReferenceId: z.number().int().positive(),
      name: z.string(),
      citations: z.number().int().positive(),
    }),
  ),
  topPassages: z.array(
    z.object({
      label: z.string(),
      bookReferenceId: z.number().int().positive(),
      chapter: z.number().int().positive(),
      verseStart: z.number().int().positive(),
      verseEnd: z.number().int().positive(),
      citations: z.number().int().positive(),
    }),
  ),
  unusedBooks: z.array(
    z.object({ bookReferenceId: z.number().int().positive(), name: z.string() }),
  ),
});
export type CoverageStats = z.infer<typeof coverageStatsSchema>;
