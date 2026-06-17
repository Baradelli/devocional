import type { PushSubscriptionInput } from '@devocional/shared';

import {
  fetchVapidPublicKey,
  removePushSubscription,
  savePushSubscription,
} from '../api/notifications.js';

/** Web Push só funciona com service worker + Notification API. */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Converte a chave VAPID (base64url) para o formato esperado pelo PushManager. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function toInput(subscription: PushSubscription): PushSubscriptionInput {
  const json = subscription.toJSON();
  const keys = json.keys ?? {};
  return {
    endpoint: subscription.endpoint,
    keys: { p256dh: keys.p256dh ?? '', auth: keys.auth ?? '' },
    label: navigator.userAgent.slice(0, 80),
  };
}

/**
 * Pede permissão, inscreve este device no Web Push e registra a subscription no
 * servidor. Retorna `false` se o usuário negou ou o navegador não suporta.
 */
export async function enablePush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return false;
  }

  const { publicKey } = await fetchVapidPublicKey();
  if (!publicKey) {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await savePushSubscription(toInput(subscription));
  return true;
}

/** Cancela a inscrição deste device e remove do servidor. */
export async function disablePush(): Promise<void> {
  if (!isPushSupported()) {
    return;
  }
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return;
  }
  await removePushSubscription(subscription.endpoint);
  await subscription.unsubscribe();
}
