export type TreeStage =
  | 'SEED'
  | 'SPROUT'
  | 'SEEDLING'
  | 'BRANCHES'
  | 'TRUNK'
  | 'YOUNG_TREE'
  | 'FRUITING';

/** Limiares por streak mínimo (ver docs/design.md §6). Ajustáveis. */
const TREE_THRESHOLDS: { min: number; stage: TreeStage }[] = [
  { min: 0, stage: 'SEED' },
  { min: 1, stage: 'SPROUT' },
  { min: 2, stage: 'SEEDLING' },
  { min: 4, stage: 'BRANCHES' },
  { min: 7, stage: 'TRUNK' },
  { min: 14, stage: 'YOUNG_TREE' },
  { min: 30, stage: 'FRUITING' },
];

/** Estágio visual da árvore derivado do streak atual. Streak 0 → semente. */
export function treeStage(currentStreak: number): TreeStage {
  let stage: TreeStage = 'SEED';
  for (const threshold of TREE_THRESHOLDS) {
    if (currentStreak >= threshold.min) {
      stage = threshold.stage;
    }
  }
  return stage;
}
