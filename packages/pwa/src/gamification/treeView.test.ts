import type { TreeStageValue } from '@devocional/shared';
import { describe, expect, it } from 'vitest';

import { TREE_STAGES, treeLevel, treeView } from './treeView.js';

describe('treeView', () => {
  it('maps every stage to non-empty copy', () => {
    for (const stage of TREE_STAGES) {
      const view = treeView(stage);
      expect(view.label.length).toBeGreaterThan(0);
      expect(view.description.length).toBeGreaterThan(0);
    }
  });

  it('grows monotonically from seed to fruiting', () => {
    const levels = TREE_STAGES.map(treeLevel);
    expect(levels).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(treeView('SEED').level).toBe(0);
    expect(treeView('FRUITING').level).toBe(treeView('FRUITING').total - 1);
  });

  it('reports the same total for any stage', () => {
    const totals = new Set(TREE_STAGES.map((s) => treeView(s).total));
    expect(totals).toEqual(new Set([TREE_STAGES.length]));
  });

  it('treats a broken streak (seed) as the lowest level, not a penalty state', () => {
    // Murcha = volta ao começo: nível 0, mesma representação calma da semente.
    const withered: TreeStageValue = 'SEED';
    expect(treeView(withered).level).toBe(0);
  });
});
