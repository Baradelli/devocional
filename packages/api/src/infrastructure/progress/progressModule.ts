import type { PrismaClient } from '@prisma/client';

import {
  completeDevotional,
  type CompleteDevotionalDeps,
  type CompleteDevotionalInput,
  type ProgressSnapshot,
} from '../../application/progress/completeDevotional.js';
import { defaultStoredState } from '../../application/progress/internal.js';
import type { AchievementRecord, StoredStreakState } from '../../application/progress/ports.js';
import {
  syncCompletions,
  type SyncCompletionsInput,
} from '../../application/progress/syncCompletions.js';
import {
  createProgressRepositories,
  createProgressUnitOfWork,
} from './prismaProgressRepositories.js';
import { createUserTimezoneReader } from './userTimezoneReader.js';

export interface ProgressView {
  streak: StoredStreakState;
  achievements: AchievementRecord[];
}

export interface ProgressModule {
  complete(input: CompleteDevotionalInput): Promise<ProgressSnapshot>;
  sync(input: SyncCompletionsInput): Promise<ProgressSnapshot>;
  getProgress(userId: string): Promise<ProgressView>;
}

export function createProgressModule(prisma: PrismaClient): ProgressModule {
  const repos = createProgressRepositories(prisma);
  const deps: CompleteDevotionalDeps = {
    users: createUserTimezoneReader(prisma),
    uow: createProgressUnitOfWork(prisma),
  };

  return {
    complete: (input) => completeDevotional(deps, input),
    sync: (input) => syncCompletions(deps, input),
    getProgress: async (userId) => {
      const [streak, achievements] = await Promise.all([
        repos.streaks.findByUserId(userId),
        repos.achievements.listByUserId(userId),
      ]);
      return { streak: streak ?? defaultStoredState(), achievements };
    },
  };
}
