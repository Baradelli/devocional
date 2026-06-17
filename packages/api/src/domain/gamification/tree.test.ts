import { describe, expect, it } from 'vitest';

import { treeStage } from './tree.js';

describe('treeStage', () => {
  it.each([
    [0, 'SEED'],
    [1, 'SPROUT'],
    [2, 'SEEDLING'],
    [3, 'SEEDLING'],
    [4, 'BRANCHES'],
    [6, 'BRANCHES'],
    [7, 'TRUNK'],
    [13, 'TRUNK'],
    [14, 'YOUNG_TREE'],
    [29, 'YOUNG_TREE'],
    [30, 'FRUITING'],
    [365, 'FRUITING'],
  ])('maps a streak of %i to %s', (streak, expected) => {
    expect(treeStage(streak)).toBe(expected);
  });

  it('wilts back to SEED when the streak resets to 0', () => {
    expect(treeStage(0)).toBe('SEED');
  });
});
