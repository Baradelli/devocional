import type { RosterEntry } from '@devocional/shared';

import { logicalDate } from '../../domain/gamification/logicalDate.js';
import type { StatsRepository } from './ports.js';

/**
 * Roster de pessoas (ADR-009): sinais leves por membro, read-only. "Concluiu
 * hoje?" e o "último dia" são resolvidos no FUSO de cada usuário (autoridade do
 * servidor) — daí `now` injetado para determinismo nos testes.
 */
export async function computeRoster(repo: StatsRepository, now: Date): Promise<RosterEntry[]> {
  const rows = await repo.getRosterUsers();
  return rows.map((row) => {
    const today = logicalDate(now, row.timezone);
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      joinedAt: row.createdAt.toISOString(),
      onboardingCompleted: row.onboardingCompletedAt !== null,
      currentStreak: row.currentStreak,
      lastCompletedDate: row.lastCompletedDate,
      completedToday: row.lastCompletedDate === today,
      totalCompletions: row.totalCompletions,
    };
  });
}
