import {
  notificationOkSchema,
  notificationSettingsSchema,
  notificationTestResultSchema,
  pushSubscriptionInputSchema,
  reminderPreferenceInputSchema,
  vapidPublicKeySchema,
  whatsappRegisterSchema,
  whatsappVerifySchema,
} from '@devocional/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { NotificationsModule } from '../../infrastructure/notifications/notificationsModule.js';
import { requireAuth } from '../identity/guards.js';

export interface NotificationsRoutesOptions {
  notifications: NotificationsModule;
}

const unsubscribeSchema = z.object({ endpoint: z.string().url() });
const ok = { ok: true };

export const notificationsRoutes: FastifyPluginAsync<NotificationsRoutesOptions> = (app, opts) => {
  const { notifications } = opts;
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    '/notifications/vapid-public-key',
    { preHandler: requireAuth, schema: { response: { 200: vapidPublicKeySchema } } },
    () => ({ publicKey: notifications.vapidPublicKey() ?? '' }),
  );

  r.get(
    '/notifications/settings',
    { preHandler: requireAuth, schema: { response: { 200: notificationSettingsSchema } } },
    (request) => notifications.getSettings(request.currentUser!.id),
  );

  r.post(
    '/notifications/push',
    {
      preHandler: requireAuth,
      schema: { body: pushSubscriptionInputSchema, response: { 200: notificationOkSchema } },
    },
    async (request) => {
      await notifications.savePushSubscription(request.currentUser!.id, request.body);
      return ok;
    },
  );

  r.delete(
    '/notifications/push',
    {
      preHandler: requireAuth,
      schema: { body: unsubscribeSchema, response: { 200: notificationOkSchema } },
    },
    async (request) => {
      await notifications.removePushSubscription(request.currentUser!.id, request.body.endpoint);
      return ok;
    },
  );

  r.post(
    '/notifications/whatsapp',
    {
      preHandler: requireAuth,
      schema: { body: whatsappRegisterSchema, response: { 200: notificationOkSchema } },
    },
    async (request) => {
      await notifications.registerWhatsapp(request.currentUser!.id, request.body.phone);
      return ok;
    },
  );

  r.post(
    '/notifications/whatsapp/verify',
    {
      preHandler: requireAuth,
      schema: { body: whatsappVerifySchema, response: { 200: notificationOkSchema } },
    },
    async (request) => {
      await notifications.verifyWhatsapp(request.currentUser!.id, request.body.code);
      return ok;
    },
  );

  r.post(
    '/notifications/test',
    { preHandler: requireAuth, schema: { response: { 200: notificationTestResultSchema } } },
    (request) => notifications.sendTestNotification(request.currentUser!.id),
  );

  r.put(
    '/notifications/reminder',
    {
      preHandler: requireAuth,
      schema: { body: reminderPreferenceInputSchema, response: { 200: notificationOkSchema } },
    },
    async (request) => {
      await notifications.saveReminderPreference(request.currentUser!.id, request.body);
      return ok;
    },
  );

  return Promise.resolve();
};
