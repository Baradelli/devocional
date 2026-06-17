import webpush from 'web-push';

import type { NotificationChannel } from '../../application/notifications/ports.js';

export interface Logger {
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
}

export interface VapidConfig {
  subject: string;
  publicKey: string;
  privateKey: string;
}

export interface WebPushChannelDeps {
  vapid: VapidConfig | null;
  log: Logger;
  /** Chamado quando um endpoint expira (404/410) para limpá-lo do banco. */
  onStaleEndpoint?: (endpoint: string) => Promise<void>;
}

interface WebPushError {
  statusCode?: number;
}

function isStale(error: unknown): boolean {
  const status = (error as WebPushError).statusCode;
  return status === 404 || status === 410;
}

/**
 * Canal Web Push (VAPID). Best-effort: nunca lança. Sem chaves VAPID
 * configuradas, vira no-op logado (o app roda sem push). Endpoints expirados
 * são limpos via `onStaleEndpoint`.
 */
export function createWebPushChannel(deps: WebPushChannelDeps): NotificationChannel {
  if (deps.vapid) {
    webpush.setVapidDetails(deps.vapid.subject, deps.vapid.publicKey, deps.vapid.privateKey);
  }

  return {
    key: 'WEB_PUSH',
    async deliver(targets, payload) {
      if (!deps.vapid) {
        deps.log.warn({ channel: 'web-push' }, 'web push disabled: missing VAPID keys');
        return { delivered: 0 };
      }

      const body = JSON.stringify(payload);
      let delivered = 0;

      for (const subscription of targets.pushSubscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            body,
          );
          delivered += 1;
        } catch (error) {
          if (isStale(error) && deps.onStaleEndpoint) {
            await deps.onStaleEndpoint(subscription.endpoint).catch(() => undefined);
          } else {
            deps.log.warn({ channel: 'web-push', endpoint: subscription.endpoint }, 'push failed');
          }
        }
      }

      return { delivered };
    },
  };
}
