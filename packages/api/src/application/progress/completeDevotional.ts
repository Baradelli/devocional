import { achievementsForStreak } from '../../domain/gamification/achievements.js';
import {
  DEFAULT_GAMIFICATION_CONFIG,
  type GamificationConfig,
} from '../../domain/gamification/config.js';
import { logicalDate } from '../../domain/gamification/logicalDate.js';
import { evaluateStreak, type StreakState } from '../../domain/gamification/streak.js';
import { treeStage } from '../../domain/gamification/tree.js';
import { ProgressError } from './errors.js';
import { defaultStoredState } from './internal.js';
import type {
  AchievementRecord,
  ProgressUnitOfWork,
  StoredStreakState,
  UserTimezoneReader,
} from './ports.js';

export interface CompleteDevotionalDeps {
  users: UserTimezoneReader;
  uow: ProgressUnitOfWork;
  config?: GamificationConfig;
}

export interface CompleteDevotionalInput {
  userId: string;
  completedAt: Date;
  idempotencyKey: string;
  devotionalId: string | null;
}

export interface ProgressSnapshot {
  streak: StoredStreakState;
  newAchievements: AchievementRecord[];
}

/**
 * Conclusão do dia com autoridade no servidor (ADR-001): o dia lógico é
 * recalculado a partir do `timezone` do usuário, não do que o cliente afirma.
 * Idempotente por (user, dia) e (user, idempotencyKey). Atualiza streak, árvore
 * e conquistas numa única transação.
 */
export async function completeDevotional(
  deps: CompleteDevotionalDeps,
  input: CompleteDevotionalInput,
): Promise<ProgressSnapshot> {
  const config = deps.config ?? DEFAULT_GAMIFICATION_CONFIG;

  const timezone = await deps.users.findTimezone(input.userId);
  if (!timezone) {
    throw new ProgressError('USER_NOT_FOUND');
  }
  const day = logicalDate(input.completedAt, timezone);

  return deps.uow.run(async ({ completions, streaks, achievements }) => {
    const inserted = await completions.insert({
      userId: input.userId,
      logicalDate: day,
      idempotencyKey: input.idempotencyKey,
      devotionalId: input.devotionalId,
      completedAt: input.completedAt,
    });

    const currentStored = await streaks.findByUserId(input.userId);

    // Reenvio idempotente: nada muda, devolve o estado atual.
    if (!inserted) {
      return { streak: currentStored ?? defaultStoredState(), newAchievements: [] };
    }

    const baseState: StreakState = currentStored
      ? {
          currentStreak: currentStored.currentStreak,
          longestStreak: currentStored.longestStreak,
          lastCompletedLogicalDate: currentStored.lastCompletedLogicalDate,
        }
      : { currentStreak: 0, longestStreak: 0, lastCompletedLogicalDate: null };

    const outcome = evaluateStreak(baseState, { logicalDate: day });
    const stage = treeStage(outcome.state.currentStreak);
    const stored = await streaks.upsert(input.userId, outcome.state, stage);

    const grants = achievementsForStreak(outcome.state.currentStreak, config);
    const newAchievements =
      grants.length > 0 ? await achievements.grantMissing(input.userId, grants) : [];

    return { streak: stored, newAchievements };
  });
}
