import { z } from 'zod';

/**
 * Schemas de progresso/gamificação. O cliente enfileira conclusões offline e
 * envia para o servidor reconciliar — a autoridade do dia lógico e do streak é
 * do servidor (ver docs/design.md ADR-001). Sem mensagens PT-BR aqui.
 */

export const treeStageSchema = z.enum([
  'SEED',
  'SPROUT',
  'SEEDLING',
  'BRANCHES',
  'TRUNK',
  'YOUNG_TREE',
  'FRUITING',
]);
export type TreeStageValue = z.infer<typeof treeStageSchema>;

export const achievementTypeSchema = z.enum(['WEEKLY_BADGE', 'MONTHLY_PRIZE']);
export type AchievementTypeValue = z.infer<typeof achievementTypeSchema>;

export const idempotencyKeySchema = z.string().min(1).max(128);

/** Uma conclusão enfileirada no device. `completedAt` é o instante real da conclusão. */
export const completionInputSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
  completedAt: z.string().datetime(),
  devotionalId: z.string().min(1).optional(),
});
export type CompletionInput = z.infer<typeof completionInputSchema>;

export const syncRequestSchema = z.object({
  completions: z.array(completionInputSchema).min(1).max(100),
});
export type SyncRequest = z.infer<typeof syncRequestSchema>;

export const streakStateSchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  lastCompletedLogicalDate: z.string().nullable(),
  treeStage: treeStageSchema,
});
export type StreakStateView = z.infer<typeof streakStateSchema>;

export const achievementSchema = z.object({
  id: z.string(),
  type: achievementTypeSchema,
  milestone: z.number().int().positive(),
  grantedAt: z.string().datetime(),
});
export type AchievementView = z.infer<typeof achievementSchema>;

/** Resposta de uma conclusão/sync: estado atual + conquistas recém-concedidas. */
export const progressSnapshotSchema = z.object({
  streak: streakStateSchema,
  newAchievements: z.array(achievementSchema),
});
export type ProgressSnapshot = z.infer<typeof progressSnapshotSchema>;

/** Estado completo para a tela do fiel reconciliar. */
export const progressViewSchema = z.object({
  streak: streakStateSchema,
  achievements: z.array(achievementSchema),
});
export type ProgressView = z.infer<typeof progressViewSchema>;

/** Mês no formato YYYY-MM (querystring do calendário de sequência). */
export const calendarMonthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'month_invalid');

export const calendarQuerySchema = z.object({
  month: calendarMonthSchema,
});
export type CalendarQuery = z.infer<typeof calendarQuerySchema>;

/**
 * Dias concluídos de um mês (dia lógico no fuso do usuário). Alimenta a faixa
 * da semana e o calendário de sequência na tela do fiel.
 */
export const calendarViewSchema = z.object({
  month: calendarMonthSchema,
  completedDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});
export type CalendarView = z.infer<typeof calendarViewSchema>;
