import type { DevotionalView, ProgressSnapshot } from '@devocional/shared';
import { useEffect, useRef, useState } from 'react';

import { ApiError } from '../api/client.js';
import { fetchToday } from '../api/devotional.js';
import { Block } from '../components/Blocks.js';
import { localStorageQueue } from '../offline/queue.js';
import { flushQueue } from '../offline/sync.js';

type Status = 'loading' | 'ready' | 'empty' | 'error';

const TREE_LABELS: Record<string, string> = {
  SEED: 'Semente',
  SPROUT: 'Broto',
  SEEDLING: 'Muda',
  BRANCHES: 'Galhos',
  TRUNK: 'Tronco firme',
  YOUNG_TREE: 'Árvore jovem',
  FRUITING: 'Árvore que floresce',
};

export function Today() {
  const queue = useRef(localStorageQueue()).current;
  const [devotional, setDevotional] = useState<DevotionalView | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    void fetchToday().then(
      (today) => {
        setDevotional(today);
        setStatus('ready');
      },
      (error: unknown) => {
        setStatus(error instanceof ApiError && error.status === 404 ? 'empty' : 'error');
      },
    );
    // Reconciliação ao abrir (caso haja conclusões pendentes na fila).
    void flushQueue(queue).then(
      (s) => s && setSnapshot(s),
      () => undefined,
    );
  }, [queue]);

  useEffect(() => {
    const reconcile = () => {
      void flushQueue(queue).then(
        (s) => s && setSnapshot(s),
        () => undefined,
      );
    };
    window.addEventListener('online', reconcile);
    return () => window.removeEventListener('online', reconcile);
  }, [queue]);

  const finish = () => {
    queue.enqueue({ idempotencyKey: crypto.randomUUID(), completedAt: new Date().toISOString() });
    setCompleted(true);
    // Otimista: enfileira sempre; tenta sincronizar (silencioso se offline).
    void flushQueue(queue).then(
      (s) => s && setSnapshot(s),
      () => undefined,
    );
  };

  if (status === 'loading') {
    return <p className="muted center">Carregando o devocional de hoje…</p>;
  }
  if (status === 'empty') {
    return (
      <div className="center empty">
        <p>O devocional de hoje ainda não está disponível.</p>
        <p className="muted">Volte um pouco mais tarde — ele chega à meia-noite.</p>
      </div>
    );
  }
  if (status === 'error' || !devotional) {
    return <p className="center">Não foi possível carregar agora. Tente novamente.</p>;
  }

  const blocks = [...devotional.blocks].sort((a, b) => a.order - b.order);

  return (
    <article className="today">
      {devotional.theme && <p className="theme">{devotional.theme}</p>}
      {blocks.map((block) => (
        <Block key={block.order} block={block} />
      ))}

      <footer className="finish">
        {completed ? (
          <div className="completed">
            <p className="completed-title">Dia concluído 🌱</p>
            {snapshot ? (
              <p className="muted">
                Sequência de {snapshot.streak.currentStreak} dia(s) ·{' '}
                {TREE_LABELS[snapshot.streak.treeStage] ?? snapshot.streak.treeStage}
              </p>
            ) : (
              <p className="muted">Salvo. Sincroniza quando você estiver online.</p>
            )}
          </div>
        ) : (
          <button type="button" className="finish-btn" onClick={finish}>
            Concluir o dia
          </button>
        )}
      </footer>
    </article>
  );
}
