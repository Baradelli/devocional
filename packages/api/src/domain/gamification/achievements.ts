import { DEFAULT_GAMIFICATION_CONFIG, type GamificationConfig } from './config.js';

export type AchievementType = 'WEEKLY_BADGE' | 'MONTHLY_PRIZE';

export interface AchievementGrant {
  type: AchievementType;
  /** O dia-marco do streak (7, 14, 30…) — chave estável e permanente. */
  milestone: number;
}

/**
 * Conquistas atingidas exatamente neste valor de streak. Como o streak sobe de
 * 1 em 1, no máximo um marco semanal e/ou mensal cai por passo. A permanência
 * (não some ao quebrar o streak) é garantida na persistência por chave única.
 */
export function achievementsForStreak(
  currentStreak: number,
  config: GamificationConfig = DEFAULT_GAMIFICATION_CONFIG,
): AchievementGrant[] {
  const grants: AchievementGrant[] = [];
  if (currentStreak <= 0) {
    return grants;
  }
  if (currentStreak % config.weeklyInterval === 0) {
    grants.push({ type: 'WEEKLY_BADGE', milestone: currentStreak });
  }
  if (currentStreak % config.monthlyInterval === 0) {
    grants.push({ type: 'MONTHLY_PRIZE', milestone: currentStreak });
  }
  return grants;
}
