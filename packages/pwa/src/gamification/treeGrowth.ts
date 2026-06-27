import type { TreeStageValue } from '@devocional/shared';

import { TREE_STAGES } from './treeView.js';

/**
 * Crescimento contínuo da árvore (ADR-012). O servidor é a autoridade do
 * `currentStreak`; aqui só o interpolamos para um valor `g` (0→6) que desenha a
 * árvore e alimenta as animações. Funções puras — sem I/O, sem estado.
 */

/** Limiares de streak por estágio, espelhando TREE_STAGES (SEED…FRUITING). */
export const STREAK_STARTS: readonly number[] = [0, 1, 2, 4, 7, 14, 30];

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Interpolação linear sobre pontos [x, y] ordenados por x, com clamp nas pontas. */
export function interp(points: readonly [number, number][], x: number): number {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) {
    return 0;
  }
  if (x <= first[0]) {
    return first[1];
  }
  if (x >= last[0]) {
    return last[1];
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (a && b && x >= a[0] && x <= b[0]) {
      return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]);
    }
  }
  return last[1];
}

/** Curva streak → crescimento contínuo (0 = semente … 6 = copa plena). */
export function growthFor(streak: number): number {
  return interp(
    [
      [0, 0],
      [1, 1],
      [3, 2.2],
      [6, 3.3],
      [13, 4.3],
      [29, 5.5],
      [44, 5.85],
      [60, 6],
    ],
    streak,
  );
}

/** Índice do estágio atual (último limiar que o streak alcançou). */
function stageIndex(streak: number): number {
  let idx = 0;
  for (let i = 0; i < STREAK_STARTS.length; i++) {
    const start = STREAK_STARTS[i];
    if (start !== undefined && streak >= start) {
      idx = i;
    }
  }
  return idx;
}

/** Estágio derivado do streak (mesmos limiares do servidor) — para rótulo/dica offline. */
export function stageForStreak(streak: number): TreeStageValue {
  return TREE_STAGES[stageIndex(streak)] ?? 'SEED';
}

export interface StageProgress {
  /** Avanço dentro do estágio atual, 0→1. */
  fraction: number;
  /** Dias até o próximo estágio (0 no máximo). */
  daysToNext: number;
  /** Próximo estágio, ou null se já está no máximo. */
  nextStage: TreeStageValue | null;
  /** Já alcançou o estágio final (FRUITING). */
  isMax: boolean;
}

/** Progresso rumo ao próximo estágio — alimenta a barra do Jardim. */
export function stageProgress(streak: number): StageProgress {
  const idx = stageIndex(streak);
  const lastIdx = STREAK_STARTS.length - 1;
  if (idx >= lastIdx) {
    return { fraction: 1, daysToNext: 0, nextStage: null, isMax: true };
  }
  const lower = STREAK_STARTS[idx] ?? 0;
  const upper = STREAK_STARTS[idx + 1] ?? lower + 1;
  return {
    fraction: clamp01((streak - lower) / (upper - lower)),
    daysToNext: Math.max(0, upper - streak),
    nextStage: TREE_STAGES[idx + 1] ?? null,
    isMax: false,
  };
}
