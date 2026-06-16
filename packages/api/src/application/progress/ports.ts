import type { AchievementType } from '../../domain/gamification/achievements.js';
import type { LogicalDate } from '../../domain/gamification/logicalDate.js';
import type { StreakState } from '../../domain/gamification/streak.js';
import type { TreeStage } from '../../domain/gamification/tree.js';

export interface UserTimezoneReader {
  findTimezone(userId: string): Promise<string | null>;
}

export interface DailyCompletionInput {
  userId: string;
  logicalDate: LogicalDate;
  idempotencyKey: string;
  devotionalId: string | null;
  completedAt: Date;
}

export interface DailyCompletionRepository {
  /**
   * Insere a conclusão; `false` quando já existia (mesmo dia ou mesma chave).
   * Usa insert idempotente (skipDuplicates) para não envenenar a transação.
   */
  insert(input: DailyCompletionInput): Promise<boolean>;
}

export interface StoredStreakState extends StreakState {
  treeStage: TreeStage;
}

export interface StreakStateRepository {
  findByUserId(userId: string): Promise<StoredStreakState | null>;
  upsert(userId: string, state: StreakState, treeStage: TreeStage): Promise<StoredStreakState>;
}

export interface AchievementRecord {
  id: string;
  type: AchievementType;
  milestone: number;
  grantedAt: Date;
}

export interface AchievementGrantInput {
  type: AchievementType;
  milestone: number;
}

export interface AchievementRepository {
  listByUserId(userId: string): Promise<AchievementRecord[]>;
  /** Concede os marcos ausentes (idempotente) e retorna só os recém-criados. */
  grantMissing(userId: string, grants: AchievementGrantInput[]): Promise<AchievementRecord[]>;
}

export interface ProgressRepositories {
  completions: DailyCompletionRepository;
  streaks: StreakStateRepository;
  achievements: AchievementRepository;
}

export interface ProgressUnitOfWork {
  run<T>(work: (repos: ProgressRepositories) => Promise<T>): Promise<T>;
}
