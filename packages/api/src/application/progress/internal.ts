import type { StoredStreakState } from './ports.js';

export function defaultStoredState(): StoredStreakState {
  return { currentStreak: 0, longestStreak: 0, lastCompletedLogicalDate: null, treeStage: 'SEED' };
}
