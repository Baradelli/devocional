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

/**
 * Grupo B (engajamento): tudo agregado, nunca nominal. Ativo = concluiu nos
 * últimos 7 dias. Taxa de conclusão diária sobre TODOS os usuários cadastrados,
 * com médias móveis de 7 e 30 dias. Retenção é semana-a-semana.
 */
export const engagementStatsSchema = z.object({
  referenceDate: z.string(),
  registeredUsers: z.number().int().nonnegative(),
  activeUsers7d: z.number().int().nonnegative(),
  dailyCompletionRate: z.object({
    today: z.number().min(0).max(100),
    avg7: z.number().min(0).max(100),
    avg30: z.number().min(0).max(100),
  }),
  retention: z.object({
    thisWeekActive: z.number().int().nonnegative(),
    lastWeekActive: z.number().int().nonnegative(),
    retained: z.number().int().nonnegative(),
    retentionPct: z.number().min(0).max(100),
  }),
  streaks: z.object({
    averageCurrent: z.number().nonnegative(),
    longest: z.number().int().nonnegative(),
  }),
  mostCompleted: z.array(
    z.object({
      devotionalId: z.string(),
      date: z.string(),
      theme: z.string().nullable(),
      completions: z.number().int().positive(),
    }),
  ),
});
export type EngagementStats = z.infer<typeof engagementStatsSchema>;

/**
 * Roster de pessoas (tela de acompanhamento pastoral — ver ADR-009). Nominal,
 * mas só com SINAIS LEVES por pessoa (streak, último dia, concluiu hoje?, total);
 * sem histórico devocional-a-devocional. `completedToday` é resolvido no fuso de
 * cada usuário (autoridade do servidor). Read-only.
 */
export const rosterEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  joinedAt: z.string().datetime(),
  onboardingCompleted: z.boolean(),
  currentStreak: z.number().int().nonnegative(),
  lastCompletedDate: z.string().nullable(),
  completedToday: z.boolean(),
  totalCompletions: z.number().int().nonnegative(),
});
export type RosterEntry = z.infer<typeof rosterEntrySchema>;

export const rosterSchema = z.array(rosterEntrySchema);
export type Roster = z.infer<typeof rosterSchema>;
