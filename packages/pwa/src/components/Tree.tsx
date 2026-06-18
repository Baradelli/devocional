import type { TreeStageValue } from '@devocional/shared';
import { useEffect, useRef, useState } from 'react';

import { TREE_ART } from '../gamification/treeArt.js';

const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Árvore-assinatura: ilustração por estágio (autoridade do servidor). Ao mudar
 * de estágio, faz um fade suave — sensação de algo vivo, não um gráfico.
 */
export function Tree({ stage }: { stage: TreeStageValue }) {
  const [shown, setShown] = useState(stage);
  const [changing, setChanging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stage === shown) {
      return;
    }
    if (reduceMotion) {
      setShown(stage);
      return;
    }
    setChanging(true);
    const t = setTimeout(() => {
      setShown(stage);
      setChanging(false);
    }, 280);
    return () => clearTimeout(t);
  }, [stage, shown]);

  return (
    <div
      className={`tree-art${changing ? ' is-changing' : ''}`}
      ref={ref}
      dangerouslySetInnerHTML={{ __html: TREE_ART[shown].art }}
    />
  );
}
