import { describe, expect, it } from 'vitest';

import { growthFor, stageForStreak, stageProgress, STREAK_STARTS } from './treeGrowth.js';
import { TREE_STAGES } from './treeView.js';

describe('growthFor', () => {
  it('honours the anchor points of the growth curve', () => {
    expect(growthFor(0)).toBeCloseTo(0);
    expect(growthFor(1)).toBeCloseTo(1);
    expect(growthFor(3)).toBeCloseTo(2.2);
    expect(growthFor(6)).toBeCloseTo(3.3);
    expect(growthFor(13)).toBeCloseTo(4.3);
    expect(growthFor(29)).toBeCloseTo(5.5);
    expect(growthFor(60)).toBeCloseTo(6);
  });

  it('interpolates linearly between anchors', () => {
    // entre [1,1] e [3,2.2]: em streak 2 → 1 + 1.2*0.5 = 1.6
    expect(growthFor(2)).toBeCloseTo(1.6);
  });

  it('clamps below zero and above the last anchor', () => {
    expect(growthFor(-5)).toBe(0);
    expect(growthFor(100)).toBeCloseTo(6);
  });

  it('never decreases as the streak grows', () => {
    let prev = -Infinity;
    for (let s = 0; s <= 80; s++) {
      const g = growthFor(s);
      expect(g).toBeGreaterThanOrEqual(prev);
      prev = g;
    }
  });
});

describe('STREAK_STARTS', () => {
  it('mirrors the domain stage order (one threshold per stage)', () => {
    expect(STREAK_STARTS).toEqual([0, 1, 2, 4, 7, 14, 30]);
    expect(STREAK_STARTS).toHaveLength(TREE_STAGES.length);
  });
});

describe('stageProgress', () => {
  it('reports the fraction and days to the next stage mid-stage', () => {
    // streak 5 → estágio BRANCHES (4–6), próximo TRUNK (7)
    const p = stageProgress(5);
    expect(p.isMax).toBe(false);
    expect(p.nextStage).toBe<typeof p.nextStage>('TRUNK');
    expect(p.daysToNext).toBe(2);
    expect(p.fraction).toBeCloseTo((5 - 4) / (7 - 4));
  });

  it('starts a stage at fraction 0 with the full gap remaining', () => {
    const p = stageProgress(7); // início de TRUNK, próximo YOUNG_TREE (14)
    expect(p.nextStage).toBe<typeof p.nextStage>('YOUNG_TREE');
    expect(p.fraction).toBeCloseTo(0);
    expect(p.daysToNext).toBe(7);
  });

  it('caps at the final stage with no next stage', () => {
    const p = stageProgress(30);
    expect(p.isMax).toBe(true);
    expect(p.nextStage).toBeNull();
    expect(p.daysToNext).toBe(0);
    expect(p.fraction).toBe(1);
    expect(stageProgress(120).isMax).toBe(true);
  });

  it('treats the seed as moving toward the sprout', () => {
    const p = stageProgress(0);
    expect(p.nextStage).toBe<typeof p.nextStage>('SPROUT');
    expect(p.daysToNext).toBe(1);
  });
});

describe('stageForStreak', () => {
  it('mirrors the server stage thresholds', () => {
    expect(stageForStreak(0)).toBe('SEED');
    expect(stageForStreak(1)).toBe('SPROUT');
    expect(stageForStreak(2)).toBe('SEEDLING');
    expect(stageForStreak(4)).toBe('BRANCHES');
    expect(stageForStreak(7)).toBe('TRUNK');
    expect(stageForStreak(14)).toBe('YOUNG_TREE');
    expect(stageForStreak(30)).toBe('FRUITING');
    expect(stageForStreak(999)).toBe('FRUITING');
  });
});
