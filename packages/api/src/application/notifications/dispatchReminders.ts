import { logicalDate } from '../../domain/gamification/logicalDate.js';
import {
  isReminderDue,
  localTimeMinutes,
  parseLocalTime,
} from '../../domain/notifications/reminder.js';
import type {
  Clock,
  NotificationChannel,
  ReminderContentProvider,
  ReminderPreferenceRepository,
} from './ports.js';

export interface NotificationTargetReader {
  getTargets(userId: string): Promise<import('./ports.js').ChannelTargets>;
}

export interface DispatchRemindersDeps {
  reminders: ReminderPreferenceRepository;
  targets: NotificationTargetReader;
  channels: NotificationChannel[];
  content: ReminderContentProvider;
  clock: Clock;
}

export interface DispatchSummary {
  evaluated: number;
  dispatched: number;
  delivered: number;
}

/**
 * Job de lembretes (ADR-002): para cada usuário cujo horário local chegou e que
 * ainda não recebeu hoje, dispara os canais ativos (best-effort, independentes)
 * e marca o envio para deduplicar por dia. Os usuários são processados em
 * sequência — os disparos ficam naturalmente espaçados (mitigação do ADR-005).
 */
export async function dispatchReminders(deps: DispatchRemindersDeps): Promise<DispatchSummary> {
  const now = deps.clock.now();
  const candidates = await deps.reminders.listCandidates();

  let dispatched = 0;
  let delivered = 0;

  for (const candidate of candidates) {
    const today = logicalDate(now, candidate.timezone);
    const due = isReminderDue({
      reminderMinute: parseLocalTime(candidate.localTime),
      hasActiveChannel: candidate.pushEnabled || candidate.whatsappEnabled,
      nowMinute: localTimeMinutes(now, candidate.timezone),
      lastSentLogicalDate: candidate.lastSentLogicalDate,
      todayLogicalDate: today,
    });
    if (!due) {
      continue;
    }

    const targets = await deps.targets.getTargets(candidate.userId);
    const payload = deps.content.build(today);

    for (const channel of deps.channels) {
      const active =
        (channel.key === 'WEB_PUSH' && candidate.pushEnabled) ||
        (channel.key === 'WHATSAPP' && candidate.whatsappEnabled);
      if (!active) {
        continue;
      }
      const result = await channel.deliver(targets, payload);
      delivered += result.delivered;
    }

    // Marca mesmo que a entrega tenha falhado: lembrete é best-effort e não
    // deve reenviar em loop no mesmo dia.
    await deps.reminders.markSent(candidate.userId, today);
    dispatched += 1;
  }

  return { evaluated: candidates.length, dispatched, delivered };
}
