import type { ProgressView } from '@devocional/shared';
import { useEffect, useState } from 'react';

import { fetchProgress } from '../api/progress.js';
import { AchievementCollection } from '../components/AchievementCollection.js';
import { Tree } from '../components/Tree.js';

type Status = 'loading' | 'ready' | 'error';

/** Tela do "jardim": a árvore que cresce com o streak + a coleção de conquistas. */
export function Garden() {
  const [progress, setProgress] = useState<ProgressView | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    void fetchProgress().then(
      (view) => {
        setProgress(view);
        setStatus('ready');
      },
      () => setStatus('error'),
    );
  }, []);

  if (status === 'loading') {
    return <p className="muted center">Carregando seu jardim…</p>;
  }
  if (status === 'error' || !progress) {
    return <p className="center">Não foi possível carregar agora. Tente novamente.</p>;
  }

  const { streak, achievements } = progress;

  return (
    <section className="garden">
      <Tree stage={streak.treeStage} />

      <div className="garden-streak">
        <p className="garden-streak-now">
          {streak.currentStreak === 0
            ? 'Comece hoje a cultivar sua sequência.'
            : `${String(streak.currentStreak)} dia(s) seguidos`}
        </p>
        {streak.longestStreak > 0 && (
          <p className="muted">Sua maior sequência: {streak.longestStreak} dia(s).</p>
        )}
      </div>

      <h2 className="garden-title">Sua coleção</h2>
      <AchievementCollection achievements={achievements} />
    </section>
  );
}
