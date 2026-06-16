import { logicalDate } from '../../domain/gamification/logicalDate.js';
import type { Clock, DevotionalRepository } from './ports.js';

export interface PublishDueDeps {
  repo: DevotionalRepository;
  clock: Clock;
  /** Fuso usado para decidir a virada do dia da publicação. */
  serverTimezone: string;
}

/**
 * Job da virada do dia: publica os devocionais cuja data já chegou. Best-effort
 * em volume, mas crítico — o chamador (cron) loga e alerta em falha.
 */
export async function publishDueDevotionals(deps: PublishDueDeps): Promise<number> {
  const now = deps.clock.now();
  const today = logicalDate(now, deps.serverTimezone);
  return deps.repo.publishDue(today, now);
}
