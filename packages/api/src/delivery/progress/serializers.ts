import type {
  AchievementView,
  ProgressSnapshot as ProgressSnapshotDto,
  ProgressView as ProgressViewDto,
  StreakStateView,
} from '@devocional/shared';

import type { ProgressSnapshot } from '../../application/progress/completeDevotional.js';
import type { AchievementRecord, StoredStreakState } from '../../application/progress/ports.js';
import type { ProgressView } from '../../infrastructure/progress/progressModule.js';

function toStreakView(streak: StoredStreakState): StreakStateView {
  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastCompletedLogicalDate: streak.lastCompletedLogicalDate,
    treeStage: streak.treeStage,
  };
}

function toAchievementView(achievement: AchievementRecord): AchievementView {
  return {
    id: achievement.id,
    type: achievement.type,
    milestone: achievement.milestone,
    grantedAt: achievement.grantedAt.toISOString(),
  };
}

export function toSnapshotView(snapshot: ProgressSnapshot): ProgressSnapshotDto {
  return {
    streak: toStreakView(snapshot.streak),
    newAchievements: snapshot.newAchievements.map(toAchievementView),
  };
}

export function toProgressView(view: ProgressView): ProgressViewDto {
  return {
    streak: toStreakView(view.streak),
    achievements: view.achievements.map(toAchievementView),
  };
}
