import type { Prisma, PrismaClient } from '@prisma/client';

import type {
  AchievementRecord,
  AchievementRepository,
  DailyCompletionRepository,
  ProgressRepositories,
  ProgressUnitOfWork,
  StoredStreakState,
  StreakStateRepository,
} from '../../application/progress/ports.js';

type PrismaLike = Pick<PrismaClient, 'dailyCompletion' | 'streakState' | 'achievement'>;

function createDailyCompletionRepository(db: PrismaLike): DailyCompletionRepository {
  return {
    async insert(input) {
      // Insert idempotente: skipDuplicates respeita ambos os índices únicos
      // (user+dia, user+chave) sem lançar erro que abortaria a transação.
      const result = await db.dailyCompletion.createMany({
        data: [
          {
            userId: input.userId,
            logicalDate: input.logicalDate,
            idempotencyKey: input.idempotencyKey,
            devotionalId: input.devotionalId,
            completedAt: input.completedAt,
          },
        ],
        skipDuplicates: true,
      });
      return result.count > 0;
    },
    async listCompletedDatesInMonth(userId, month) {
      const rows = await db.dailyCompletion.findMany({
        where: { userId, logicalDate: { startsWith: `${month}-` } },
        select: { logicalDate: true },
        orderBy: { logicalDate: 'asc' },
      });
      return rows.map((row) => row.logicalDate);
    },
  };
}

function toStoredStreak(row: {
  currentStreak: number;
  longestStreak: number;
  lastCompletedLogicalDate: string | null;
  treeStage: StoredStreakState['treeStage'];
}): StoredStreakState {
  return {
    currentStreak: row.currentStreak,
    longestStreak: row.longestStreak,
    lastCompletedLogicalDate: row.lastCompletedLogicalDate,
    treeStage: row.treeStage,
  };
}

function createStreakStateRepository(db: PrismaLike): StreakStateRepository {
  return {
    async findByUserId(userId) {
      const row = await db.streakState.findUnique({ where: { userId } });
      return row ? toStoredStreak(row) : null;
    },
    async upsert(userId, state, treeStage) {
      const data = {
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastCompletedLogicalDate: state.lastCompletedLogicalDate,
        treeStage,
      };
      const row = await db.streakState.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      });
      return toStoredStreak(row);
    },
  };
}

function toAchievementRecord(row: {
  id: string;
  type: AchievementRecord['type'];
  milestone: number;
  grantedAt: Date;
}): AchievementRecord {
  return { id: row.id, type: row.type, milestone: row.milestone, grantedAt: row.grantedAt };
}

function createAchievementRepository(db: PrismaLike): AchievementRepository {
  return {
    async listByUserId(userId) {
      const rows = await db.achievement.findMany({
        where: { userId },
        orderBy: { grantedAt: 'asc' },
      });
      return rows.map(toAchievementRecord);
    },
    async grantMissing(userId, grants) {
      if (grants.length === 0) {
        return [];
      }
      const keys = grants.map((g) => ({ type: g.type, milestone: g.milestone }));
      const existing = await db.achievement.findMany({ where: { userId, OR: keys } });
      const existingKeys = new Set(existing.map((a) => `${a.type}:${String(a.milestone)}`));
      const toCreate = grants.filter((g) => !existingKeys.has(`${g.type}:${String(g.milestone)}`));
      if (toCreate.length === 0) {
        return [];
      }
      await db.achievement.createMany({
        data: toCreate.map((g) => ({ userId, type: g.type, milestone: g.milestone })),
        skipDuplicates: true,
      });
      const created = await db.achievement.findMany({
        where: { userId, OR: toCreate.map((g) => ({ type: g.type, milestone: g.milestone })) },
      });
      return created.map(toAchievementRecord);
    },
  };
}

export function createProgressRepositories(db: PrismaLike): ProgressRepositories {
  return {
    completions: createDailyCompletionRepository(db),
    streaks: createStreakStateRepository(db),
    achievements: createAchievementRepository(db),
  };
}

export function createProgressUnitOfWork(prisma: PrismaClient): ProgressUnitOfWork {
  return {
    run: (work) =>
      prisma.$transaction((tx: Prisma.TransactionClient) => work(createProgressRepositories(tx))),
  };
}
