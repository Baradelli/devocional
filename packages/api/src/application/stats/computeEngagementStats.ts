import type { EngagementStats } from '@devocional/shared';

import { addDays, lastNDates } from '../../domain/stats/dateWindow.js';
import type { StatsRepository } from './ports.js';

const ACTIVE_WINDOW = 7;
const RATE_WINDOW = 30;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Engajamento agregado (nunca nominal). `today` é o dia lógico do servidor.
 * Ativo = concluiu nos últimos 7 dias; taxa de conclusão diária sobre todos os
 * usuários cadastrados (médias móveis 7/30 dias); retenção semana-a-semana.
 */
export async function computeEngagementStats(
  repo: StatsRepository,
  today: string,
): Promise<EngagementStats> {
  const windowStart = addDays(today, -(RATE_WINDOW - 1));

  const [registeredUsers, completionDays, streakRows, mostCompleted] = await Promise.all([
    repo.countUsers(),
    repo.getCompletionDaysSince(windowStart),
    repo.getStreakRows(),
    repo.getMostCompletedDevotionals(5),
  ]);

  const byDay = new Map<string, Set<string>>();
  for (const c of completionDays) {
    let users = byDay.get(c.logicalDate);
    if (!users) {
      users = new Set<string>();
      byDay.set(c.logicalDate, users);
    }
    users.add(c.userId);
  }
  const usersOn = (day: string): Set<string> => byDay.get(day) ?? new Set<string>();
  const unionOver = (days: string[]): Set<string> => {
    const union = new Set<string>();
    for (const day of days) {
      for (const id of usersOn(day)) {
        union.add(id);
      }
    }
    return union;
  };

  const last7 = lastNDates(today, ACTIVE_WINDOW);
  const last30 = lastNDates(today, RATE_WINDOW);

  const rateOn = (day: string): number =>
    registeredUsers === 0 ? 0 : round1((usersOn(day).size / registeredUsers) * 100);
  const meanRate = (days: string[]): number => {
    if (registeredUsers === 0) {
      return 0;
    }
    const sum = days.reduce((acc, day) => acc + usersOn(day).size / registeredUsers, 0);
    return round1((sum / days.length) * 100);
  };

  const thisWeek = unionOver(last7);
  const lastWeek = unionOver(lastNDates(addDays(today, -ACTIVE_WINDOW), ACTIVE_WINDOW));
  let retained = 0;
  for (const id of thisWeek) {
    if (lastWeek.has(id)) {
      retained += 1;
    }
  }

  const streaks =
    streakRows.length === 0
      ? { averageCurrent: 0, longest: 0 }
      : {
          averageCurrent: round1(
            streakRows.reduce((acc, row) => acc + row.currentStreak, 0) / streakRows.length,
          ),
          longest: streakRows.reduce((max, row) => Math.max(max, row.longestStreak), 0),
        };

  return {
    referenceDate: today,
    registeredUsers,
    activeUsers7d: thisWeek.size,
    dailyCompletionRate: {
      today: rateOn(today),
      avg7: meanRate(last7),
      avg30: meanRate(last30),
    },
    retention: {
      thisWeekActive: thisWeek.size,
      lastWeekActive: lastWeek.size,
      retained,
      retentionPct: lastWeek.size === 0 ? 0 : round1((retained / lastWeek.size) * 100),
    },
    streaks,
    mostCompleted,
  };
}
