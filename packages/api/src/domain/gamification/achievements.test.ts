import { describe, expect, it } from 'vitest';

import { achievementsForStreak } from './achievements.js';

describe('achievementsForStreak', () => {
  it('grants nothing before the first weekly milestone', () => {
    expect(achievementsForStreak(0)).toEqual([]);
    expect(achievementsForStreak(6)).toEqual([]);
  });

  it('grants a weekly badge every 7 consecutive days', () => {
    expect(achievementsForStreak(7)).toEqual([{ type: 'WEEKLY_BADGE', milestone: 7 }]);
    expect(achievementsForStreak(14)).toEqual([{ type: 'WEEKLY_BADGE', milestone: 14 }]);
    expect(achievementsForStreak(21)).toEqual([{ type: 'WEEKLY_BADGE', milestone: 21 }]);
  });

  it('grants a monthly prize every 30 consecutive days', () => {
    expect(achievementsForStreak(30)).toEqual([{ type: 'MONTHLY_PRIZE', milestone: 30 }]);
  });

  it('grants both when a streak is a multiple of 7 and 30', () => {
    expect(achievementsForStreak(210)).toEqual([
      { type: 'WEEKLY_BADGE', milestone: 210 },
      { type: 'MONTHLY_PRIZE', milestone: 210 },
    ]);
  });
});
