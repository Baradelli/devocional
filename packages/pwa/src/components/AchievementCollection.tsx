import type { AchievementView as AchievementDto } from '@devocional/shared';

import { achievementView } from '../gamification/achievementView.js';

interface AchievementCollectionProps {
  achievements: AchievementDto[];
}

/** Jardim pessoal: coleção permanente de insígnias e prêmios (nunca somem). */
export function AchievementCollection({ achievements }: AchievementCollectionProps) {
  if (achievements.length === 0) {
    return (
      <div className="center empty">
        <p>Sua coleção começa aqui.</p>
        <p className="muted">A cada 7 dias seguidos, uma insígnia floresce no seu jardim.</p>
      </div>
    );
  }

  const ordered = [...achievements].sort((a, b) => a.grantedAt.localeCompare(b.grantedAt));

  return (
    <ul className="collection">
      {ordered.map((achievement) => {
        const view = achievementView(achievement.type, achievement.milestone);
        return (
          <li key={achievement.id} className="collection-item">
            <span className="collection-icon" aria-hidden="true">
              {view.icon}
            </span>
            <span className="collection-label">{view.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
