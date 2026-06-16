import { describe, expect, it } from 'vitest';

import { evaluateStreak, type StreakState } from './streak.js';

function state(overrides: Partial<StreakState> = {}): StreakState {
  return { currentStreak: 0, longestStreak: 0, lastCompletedLogicalDate: null, ...overrides };
}

describe('evaluateStreak', () => {
  it('starts the streak at 1 on the first completion', () => {
    const outcome = evaluateStreak(state(), { logicalDate: '2026-06-16' });
    expect(outcome.changed).toBe(true);
    expect(outcome.state).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      lastCompletedLogicalDate: '2026-06-16',
    });
  });

  it('increments on a consecutive day', () => {
    const outcome = evaluateStreak(
      state({ currentStreak: 3, longestStreak: 3, lastCompletedLogicalDate: '2026-06-15' }),
      { logicalDate: '2026-06-16' },
    );
    expect(outcome.state.currentStreak).toBe(4);
    expect(outcome.state.longestStreak).toBe(4);
  });

  it('resets to 1 when a day is skipped, preserving the longest streak', () => {
    const outcome = evaluateStreak(
      state({ currentStreak: 9, longestStreak: 9, lastCompletedLogicalDate: '2026-06-13' }),
      { logicalDate: '2026-06-16' },
    );
    expect(outcome.state.currentStreak).toBe(1);
    expect(outcome.state.longestStreak).toBe(9);
    expect(outcome.changed).toBe(true);
  });

  it('is idempotent for the same day (no double count)', () => {
    const before = state({
      currentStreak: 5,
      longestStreak: 5,
      lastCompletedLogicalDate: '2026-06-16',
    });
    const outcome = evaluateStreak(before, { logicalDate: '2026-06-16' });
    expect(outcome.changed).toBe(false);
    expect(outcome.state).toEqual(before);
  });

  it('ignores a completion older than the last recorded day', () => {
    const before = state({
      currentStreak: 5,
      longestStreak: 5,
      lastCompletedLogicalDate: '2026-06-16',
    });
    const outcome = evaluateStreak(before, { logicalDate: '2026-06-14' });
    expect(outcome.changed).toBe(false);
    expect(outcome.state).toEqual(before);
  });
});
