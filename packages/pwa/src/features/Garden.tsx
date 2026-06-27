import type { ProgressView, StreakStateView } from '@devocional/shared';
import { useEffect, useState } from 'react';
import { LuArrowLeft } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';

import { fetchProgress } from '../api/progress.js';
import { Herbarium } from '../components/Herbarium.js';
import { TreeCanvas } from '../components/TreeCanvas.js';
import { growthFor, stageProgress } from '../gamification/treeGrowth.js';
import { treeView } from '../gamification/treeView.js';
import { useGrowthAnimation } from '../gamification/useGrowthAnimation.js';

type Status = 'loading' | 'ready' | 'error';

const OPEN_MS = 2550;

/** A árvore do Jardim: cresce do zero até o estágio atual ao abrir a tela (ADR-012). */
function GardenTree({ streak }: { streak: StreakStateView }) {
  const { growth, set, animateTo } = useGrowthAnimation(0);
  const view = treeView(streak.treeStage);
  const progress = stageProgress(streak.currentStreak);

  useEffect(() => {
    set(0);
    animateTo(growthFor(streak.currentStreak), OPEN_MS);
  }, [streak.currentStreak, set, animateTo]);

  return (
    <section className="tree-stage">
      <div className="tree-canvas">
        <TreeCanvas growth={growth} />
      </div>
      <div className="tree-meta">
        <p className="tree-streak">
          <b>{streak.currentStreak}</b>
          <span>{streak.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}</span>
        </p>
        <p className="tree-name display">{view.label}</p>
        <p className="tree-hint">{view.description}</p>
      </div>
      <div className="tree-progress">
        <div className="tree-progress__bar">
          <div
            className="tree-progress__fill"
            style={{ width: `${String(Math.round(progress.fraction * 100))}%` }}
          />
        </div>
        <p className="tree-progress__text">
          {progress.isMax || !progress.nextStage
            ? 'Estágio máximo · árvore plena'
            : `Faltam ${String(progress.daysToNext)} ${progress.daysToNext === 1 ? 'dia' : 'dias'} para ${treeView(progress.nextStage).label}`}
        </p>
      </div>
    </section>
  );
}

/** O jardim: a árvore que cresce com o streak + o herbário de conquistas. */
export function Garden() {
  const navigate = useNavigate();
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
          onClick={() => void navigate('/today')}
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
          <GardenTree streak={progress.streak} />
          <Herbarium achievements={progress.achievements} />
        </main>
      )}
    </section>
  );
}
