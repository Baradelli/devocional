import {
  completeDevotional,
  type CompleteDevotionalDeps,
  type ProgressSnapshot,
} from './completeDevotional.js';
import { defaultStoredState } from './internal.js';
import type { AchievementRecord } from './ports.js';

export interface QueuedCompletion {
  completedAt: Date;
  idempotencyKey: string;
  devotionalId: string | null;
}

export interface SyncCompletionsInput {
  userId: string;
  completions: QueuedCompletion[];
}

/**
 * Reconcilia a fila offline. Processa em ordem cronológica de conclusão para o
 * streak avançar corretamente; cada item é idempotente. Devolve o estado final
 * e o conjunto de conquistas concedidas durante a reconciliação.
 */
export async function syncCompletions(
  deps: CompleteDevotionalDeps,
  input: SyncCompletionsInput,
): Promise<ProgressSnapshot> {
  const ordered = [...input.completions].sort(
    (a, b) => a.completedAt.getTime() - b.completedAt.getTime(),
  );

  const newAchievements: AchievementRecord[] = [];
  let lastSnapshot: ProgressSnapshot | null = null;

  for (const completion of ordered) {
    const snapshot = await completeDevotional(deps, {
      userId: input.userId,
      completedAt: completion.completedAt,
      idempotencyKey: completion.idempotencyKey,
      devotionalId: completion.devotionalId,
    });
    newAchievements.push(...snapshot.newAchievements);
    lastSnapshot = snapshot;
  }

  return { streak: lastSnapshot?.streak ?? defaultStoredState(), newAchievements };
}
