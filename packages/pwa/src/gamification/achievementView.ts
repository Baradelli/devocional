import type { AchievementTypeValue } from '@devocional/shared';

export interface AchievementView {
  label: string;
  icon: string;
}

const ACHIEVEMENT_COPY: Record<AchievementTypeValue, { label: string; icon: string }> = {
  WEEKLY_BADGE: { label: 'Insígnia da semana', icon: '🌿' },
  MONTHLY_PRIZE: { label: 'Prêmio do mês', icon: '🌳' },
};

export function achievementView(type: AchievementTypeValue, milestone: number): AchievementView {
  const copy = ACHIEVEMENT_COPY[type];
  return { label: `${copy.label} · ${String(milestone)} dias`, icon: copy.icon };
}
