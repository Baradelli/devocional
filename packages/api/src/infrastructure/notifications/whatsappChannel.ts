import type {
  NotificationChannel,
  WhatsappVerificationSender,
} from '../../application/notifications/ports.js';
import type { Alerter } from '../observability/alerter.js';
import type { Logger } from './webPushChannel.js';

/**
 * Transporte de WhatsApp: o ponto exato onde a sessão não-oficial (ADR-005)
 * conversa com o número. É o que se troca depois (Baileys/whatsapp-web.js, chip
 * dedicado, ou a Cloud API oficial) sem tocar no núcleo. Pode rejeitar quando a
 * sessão cai — os adapters abaixo capturam e alertam.
 */
export interface WhatsappTransport {
  send(phone: string, message: string): Promise<void>;
}

/** Transporte stub: por ora só loga. A sessão real entra aqui depois. */
export function createStubWhatsappTransport(log: Logger): WhatsappTransport {
  return {
    send(phone, message) {
      log.info({ channel: 'whatsapp', phone, message }, 'whatsapp send (stub)');
      return Promise.resolve();
    },
  };
}

export interface WhatsappAdapterDeps {
  transport: WhatsappTransport;
  alerter: Alerter;
}

/**
 * Adapter de WhatsApp atrás da interface `NotificationChannel` (ADR-005).
 * Best-effort: nunca lança. Falha de transporte → alerta
 * `WHATSAPP_SESSION_UNAVAILABLE` (a sessão pode ter caído) e segue.
 */
export function createWhatsappChannel(deps: WhatsappAdapterDeps): NotificationChannel {
  return {
    key: 'WHATSAPP',
    async deliver(targets, payload) {
      if (!targets.whatsappPhone) {
        return { delivered: 0 };
      }
      try {
        await deps.transport.send(targets.whatsappPhone, payload.title);
        return { delivered: 1 };
      } catch (cause) {
        deps.alerter.alert({
          event: 'WHATSAPP_SESSION_UNAVAILABLE',
          severity: 'warning',
          message: 'whatsapp reminder delivery failed',
          context: { phone: targets.whatsappPhone },
          cause,
        });
        return { delivered: 0 };
      }
    },
  };
}

/** Envio do código de verificação pelo mesmo transporte. */
export function createWhatsappVerificationSender(
  deps: WhatsappAdapterDeps,
): WhatsappVerificationSender {
  return {
    async sendCode(phone, code) {
      try {
        await deps.transport.send(phone, `Seu código de verificação: ${code}`);
      } catch (cause) {
        deps.alerter.alert({
          event: 'WHATSAPP_SESSION_UNAVAILABLE',
          severity: 'warning',
          message: 'whatsapp verification code delivery failed',
          context: { phone },
          cause,
        });
      }
    },
  };
}
