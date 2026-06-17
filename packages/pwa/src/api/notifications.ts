import {
  notificationOkSchema,
  type NotificationSettings,
  notificationSettingsSchema,
  type PushSubscriptionInput,
  type ReminderPreferenceInput,
  type VapidPublicKey,
  vapidPublicKeySchema,
  type WhatsappRegisterInput,
  type WhatsappVerifyInput,
} from '@devocional/shared';

import { apiRequest } from './client.js';

export function fetchNotificationSettings(): Promise<NotificationSettings> {
  return apiRequest('/notifications/settings', notificationSettingsSchema);
}

export function fetchVapidPublicKey(): Promise<VapidPublicKey> {
  return apiRequest('/notifications/vapid-public-key', vapidPublicKeySchema);
}

export function savePushSubscription(input: PushSubscriptionInput): Promise<{ ok: boolean }> {
  return apiRequest('/notifications/push', notificationOkSchema, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function removePushSubscription(endpoint: string): Promise<{ ok: boolean }> {
  return apiRequest('/notifications/push', notificationOkSchema, {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  });
}

export function registerWhatsapp(input: WhatsappRegisterInput): Promise<{ ok: boolean }> {
  return apiRequest('/notifications/whatsapp', notificationOkSchema, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function verifyWhatsapp(input: WhatsappVerifyInput): Promise<{ ok: boolean }> {
  return apiRequest('/notifications/whatsapp/verify', notificationOkSchema, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function saveReminderPreference(input: ReminderPreferenceInput): Promise<{ ok: boolean }> {
  return apiRequest('/notifications/reminder', notificationOkSchema, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
