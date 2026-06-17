import type { TreeStageValue } from '@devocional/shared';

/** Ordem de crescimento da árvore (espelha os limiares do domínio, M2). */
export const TREE_STAGES: TreeStageValue[] = [
  'SEED',
  'SPROUT',
  'SEEDLING',
  'BRANCHES',
  'TRUNK',
  'YOUNG_TREE',
  'FRUITING',
];

export interface TreeView {
  stage: TreeStageValue;
  label: string;
  /** Posição na jornada (0 = semente … total-1 = floração). */
  level: number;
  total: number;
  description: string;
}

const TREE_COPY: Record<TreeStageValue, { label: string; description: string }> = {
  SEED: { label: 'Semente', description: 'Plantada. Volte amanhã para vê-la brotar.' },
  SPROUT: { label: 'Broto', description: 'Os primeiros dias já germinam.' },
  SEEDLING: { label: 'Muda', description: 'Ganhando forma, dia após dia.' },
  BRANCHES: { label: 'Galhos', description: 'Os galhos começam a se abrir.' },
  TRUNK: { label: 'Tronco firme', description: 'Raízes visíveis — uma semana de constância.' },
  YOUNG_TREE: { label: 'Árvore jovem', description: 'Frondosa e firme.' },
  FRUITING: { label: 'Árvore que floresce', description: 'Floresce e dá frutos.' },
};

export function treeLevel(stage: TreeStageValue): number {
  return TREE_STAGES.indexOf(stage);
}

export function treeView(stage: TreeStageValue): TreeView {
  const copy = TREE_COPY[stage];
  return {
    stage,
    label: copy.label,
    description: copy.description,
    level: treeLevel(stage),
    total: TREE_STAGES.length,
  };
}
