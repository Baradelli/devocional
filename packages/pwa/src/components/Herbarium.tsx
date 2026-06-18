import type { AchievementView } from '@devocional/shared';

import { monthlyStamp, weeklyStamp } from '../gamification/treeArt.js';
import { formatDayMonth } from '../lib/dates.js';

function HerbCard({
  earned,
  name,
  date,
  stamp,
}: {
  earned: boolean;
  name: string;
  date: string;
  stamp: (earned: boolean) => string;
}) {
  return (
    <div className={`herb-card${earned ? '' : ' herb-card--locked'}`}>
      <div className="herb-card__art" dangerouslySetInnerHTML={{ __html: stamp(earned) }} />
      <span className="herb-card__name">{name}</span>
      <span className="herb-card__date">{date}</span>
    </div>
  );
}

function Group({
  label,
  earned,
  stamp,
  prizes = false,
}: {
  label: string;
  earned: AchievementView[];
  stamp: (earned: boolean) => string;
  prizes?: boolean;
}) {
  return (
    <div className="herb-group">
      <div className="herb-group__title">
        <span className="label">{label}</span>
        <span className="herb-group__count">{earned.length} conquistada(s)</span>
      </div>
      <div className={`herb-grid${prizes ? ' herb-grid--prizes' : ''}`}>
        {earned.map((a) => (
          <HerbCard
            key={a.id}
            earned
            name={`${String(a.milestone)} dias`}
            date={formatDayMonth(new Date(a.grantedAt))}
            stamp={stamp}
          />
        ))}
        {/* Convite: a próxima conquista, prensada e tracejada. */}
        <HerbCard earned={false} name="A conquistar" date="" stamp={stamp} />
      </div>
    </div>
  );
}

/** Herbário pessoal: insígnias semanais e prêmios mensais, permanentes. */
export function Herbarium({ achievements }: { achievements: AchievementView[] }) {
  const weekly = [...achievements]
    .filter((a) => a.type === 'WEEKLY_BADGE')
    .sort((a, b) => a.grantedAt.localeCompare(b.grantedAt));
  const monthly = [...achievements]
    .filter((a) => a.type === 'MONTHLY_PRIZE')
    .sort((a, b) => a.grantedAt.localeCompare(b.grantedAt));

  return (
    <section className="herbarium">
      <h2 className="display">Seu herbário</h2>
      <p className="herbarium__intro">
        Cada conquista fica prensada aqui para sempre — mesmo que a árvore recomece.
      </p>
      <Group label="Insígnias da semana" earned={weekly} stamp={weeklyStamp} />
      <Group label="Prêmios do mês" earned={monthly} stamp={monthlyStamp} prizes />
    </section>
  );
}
