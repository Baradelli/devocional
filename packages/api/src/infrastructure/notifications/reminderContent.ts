import { randomInt } from 'node:crypto';

import type {
  CodeGenerator,
  ReminderContentProvider,
  ReminderPayload,
} from '../../application/notifications/ports.js';

/** Conteúdo PT-BR do lembrete (texto que o fiel lê — ver convenção de idioma). */
export function createReminderContentProvider(appUrl: string): ReminderContentProvider {
  return {
    build() {
      return {
        title: 'Seu devocional de hoje',
        body: 'Reserve um momento de quietude. Seu devocional está esperando por você.',
        url: appUrl,
      };
    },
  };
}

/** Conteúdo PT-BR da notificação de teste (texto que o fiel lê). */
export function createTestNotificationPayload(appUrl: string): ReminderPayload {
  return {
    title: 'Tudo certo! 🌱',
    body: 'Seus lembretes estão funcionando. Até o próximo devocional.',
    url: appUrl,
  };
}

/** Código numérico de 6 dígitos para verificação de WhatsApp. */
export function createNumericCodeGenerator(): CodeGenerator {
  return {
    generate: () => String(randomInt(0, 1_000_000)).padStart(6, '0'),
  };
}
