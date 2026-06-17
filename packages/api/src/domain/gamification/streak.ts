import { daysBetween, type LogicalDate } from './logicalDate.js';

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastCompletedLogicalDate: LogicalDate | null;
}

export interface StreakCompletion {
  logicalDate: LogicalDate;
}

export interface StreakOutcome {
  state: StreakState;
  /** `false` quando a conclusão foi idempotente (mesmo dia) ou ignorada (mais antiga). */
  changed: boolean;
}

/**
 * Máquina de estado pura do streak. A autoridade é do servidor: incrementa em
 * dia consecutivo, zera ao pular um dia (mas o `longestStreak` é preservado), e
 * é idempotente para reenvios do mesmo dia.
 */
export function evaluateStreak(state: StreakState, completion: StreakCompletion): StreakOutcome {
  const last = state.lastCompletedLogicalDate;

  if (last === null) {
    return {
      changed: true,
      state: {
        currentStreak: 1,
        longestStreak: Math.max(state.longestStreak, 1),
        lastCompletedLogicalDate: completion.logicalDate,
      },
    };
  }

  const diff = daysBetween(last, completion.logicalDate);

  // Mesmo dia (reenvio) ou conclusão mais antiga que a última: sem efeito.
  if (diff <= 0) {
    return { changed: false, state };
  }

  const currentStreak = diff === 1 ? state.currentStreak + 1 : 1;
  return {
    changed: true,
    state: {
      currentStreak,
      longestStreak: Math.max(state.longestStreak, currentStreak),
      lastCompletedLogicalDate: completion.logicalDate,
    },
  };
}
