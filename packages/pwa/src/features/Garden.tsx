import type { ProgressView } from '@devocional/shared';
import { useEffect, useState } from 'react';
import { LuArrowLeft } from 'react-icons/lu';

import { fetchProgress } from '../api/progress.js';
import { Herbarium } from '../components/Herbarium.js';
import { Tree } from '../components/Tree.js';
import { TREE_ART } from '../gamification/treeArt.js';

type Status = 'loading' | 'ready' | 'error';

/** O jardim: a árvore que cresce com o streak + o herbário de conquistas. */
export function Garden({ onBack }: { onBack: () => void }) {
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

  return (
    <section className="screen screen--garden">
      <header className="topbar">
        <button
          type="button"
          className="topbar__icon"
          onClick={onBack}
          aria-label="Voltar para hoje"
        >
          <LuArrowLeft />
        </button>
        <span className="eyebrow">Seu jardim</span>
        <span className="topbar__icon" aria-hidden="true" />
      </header>

      {status === 'loading' && <p className="muted center">Carregando seu jardim…</p>}
      {status === 'error' && (
        <p className="center">Não foi possível carregar agora. Tente novamente.</p>
      )}

      {status === 'ready' && progress && (
        <main className="garden">
          <section className="tree-stage">
            <Tree stage={progress.streak.treeStage} />
            <div className="tree-meta">
              <p className="tree-streak">
                <b>{progress.streak.currentStreak}</b>
                <span>dias seguidos</span>
              </p>
              <p className="tree-name display">{TREE_ART[progress.streak.treeStage].name}</p>
              <p className="tree-hint">{TREE_ART[progress.streak.treeStage].hint}</p>
            </div>
          </section>

          <Herbarium achievements={progress.achievements} />
        </main>
      )}
    </section>
  );
}
