-- CreateEnum
CREATE TYPE "TreeStage" AS ENUM ('SEED', 'SPROUT', 'SEEDLING', 'BRANCHES', 'TRUNK', 'YOUNG_TREE', 'FRUITING');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('WEEKLY_BADGE', 'MONTHLY_PRIZE');

-- CreateTable
CREATE TABLE "DailyCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "logicalDate" TEXT NOT NULL,
    "devotionalId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakState" (
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedLogicalDate" TEXT,
    "treeStage" "TreeStage" NOT NULL DEFAULT 'SEED',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreakState_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AchievementType" NOT NULL,
    "milestone" INTEGER NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyCompletion_userId_idx" ON "DailyCompletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCompletion_userId_logicalDate_key" ON "DailyCompletion"("userId", "logicalDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCompletion_userId_idempotencyKey_key" ON "DailyCompletion"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_userId_type_milestone_key" ON "Achievement"("userId", "type", "milestone");

-- AddForeignKey
ALTER TABLE "DailyCompletion" ADD CONSTRAINT "DailyCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakState" ADD CONSTRAINT "StreakState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

