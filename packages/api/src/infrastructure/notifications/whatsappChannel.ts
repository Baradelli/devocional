import type {
  NotificationChannel,
  WhatsappVerificationSender,
} from '../../application/notifications/ports.js';
import type { Logger } from './webPushChannel.js';

/**
 * Adapter de WhatsApp atrás da interface `NotificationChannel` (ADR-005). Por
 * ora é um stub best-effort que apenas loga — a integração com a lib não-oficial
 * (Baileys/whatsapp-web.js, chip dedicado, sessão persistida) entra depois sem
 * tocar no núcleo. Por design, é trocável por um adapter da Cloud API oficial.
 */
export function createWhatsappChannel(log: Logger): NotificationChannel {
  return {
    key: 'WHATSAPP',
    deliver(targets, payload) {
      if (!targets.whatsappPhone) {
        return Promise.resolve({ delivered: 0 });
      }
      log.info(
        { channel: 'whatsapp', phone: targets.whatsappPhone, title: payload.title },
        'whatsapp reminder (stub)',
      );
      return Promise.resolve({ delivered: 1 });
    },
  };
}

/** Envio do código de verificação pelo mesmo adapter stub. */
export function createWhatsappVerificationSender(log: Logger): WhatsappVerificationSender {
  return {
    sendCode(phone, code) {
      log.info({ channel: 'whatsapp', phone, code }, 'whatsapp verification code (stub)');
      return Promise.resolve();
    },
  };
}
