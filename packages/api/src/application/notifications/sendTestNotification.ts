import type { NotificationTargetReader } from './dispatchReminders.js';
import type { NotificationChannel, ReminderPayload } from './ports.js';

export interface SendTestNotificationDeps {
  targets: NotificationTargetReader;
  channels: NotificationChannel[];
  payload: ReminderPayload;
}

/**
 * Envia uma notificação de teste imediata para os aparelhos do usuário,
 * apenas pelo Web Push (prova ponta a ponta: subscription salva → VAPID →
 * serviço de push → service worker). Best-effort: devolve quantos receberam.
 * Não aciona WhatsApp — o teste valida o canal de push deste aparelho.
 */
export async function sendTestNotification(
  deps: SendTestNotificationDeps,
  userId: string,
): Promise<{ delivered: number }> {
  const targets = await deps.targets.getTargets(userId);
  let delivered = 0;
  for (const channel of deps.channels) {
    if (channel.key !== 'WEB_PUSH') {
      continue;
    }
    const result = await channel.deliver(targets, deps.payload);
    delivered += result.delivered;
  }
  return { delivered };
}
