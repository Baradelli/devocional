import type {
  NotificationSettings,
  PushSubscriptionInput,
  ReminderPreferenceInput,
} from '@devocional/shared';
import type { PrismaClient } from '@prisma/client';

import {
  dispatchReminders,
  type DispatchSummary,
} from '../../application/notifications/dispatchReminders.js';
import type { NotificationChannel } from '../../application/notifications/ports.js';
import {
  removePushSubscription,
  savePushSubscription,
} from '../../application/notifications/pushSubscriptions.js';
import {
  getNotificationSettings,
  saveReminderPreference,
} from '../../application/notifications/reminderSettings.js';
import { registerWhatsapp, verifyWhatsapp } from '../../application/notifications/whatsapp.js';
import { createSystemClock } from '../clock.js';
import {
  createNotificationRepositories,
  createNotificationTargetReader,
} from './prismaNotificationRepositories.js';
import { createNumericCodeGenerator, createReminderContentProvider } from './reminderContent.js';
import { createWebPushChannel, type Logger, type VapidConfig } from './webPushChannel.js';
import { createWhatsappChannel, createWhatsappVerificationSender } from './whatsappChannel.js';

export interface NotificationsConfig {
  vapid: VapidConfig | null;
  appUrl: string;
}

export interface NotificationsModule {
  vapidPublicKey(): string | null;
  savePushSubscription(userId: string, input: PushSubscriptionInput): Promise<void>;
  removePushSubscription(userId: string, endpoint: string): Promise<void>;
  registerWhatsapp(userId: string, phone: string): Promise<void>;
  verifyWhatsapp(userId: string, code: string): Promise<void>;
  saveReminderPreference(userId: string, input: ReminderPreferenceInput): Promise<void>;
  getSettings(userId: string): Promise<NotificationSettings>;
  dispatchReminders(): Promise<DispatchSummary>;
}

export function createNotificationsModule(
  prisma: PrismaClient,
  config: NotificationsConfig,
  log: Logger,
): NotificationsModule {
  const repos = createNotificationRepositories(prisma);
  const targets = createNotificationTargetReader(prisma);
  const clock = createSystemClock();
  const codes = createNumericCodeGenerator();
  const content = createReminderContentProvider(config.appUrl);
  const verificationSender = createWhatsappVerificationSender(log);

  const channels: NotificationChannel[] = [
    createWebPushChannel({
      vapid: config.vapid,
      log,
      onStaleEndpoint: async (endpoint) => {
        await prisma.pushSubscription.deleteMany({ where: { endpoint } });
      },
    }),
    createWhatsappChannel(log),
  ];

  return {
    vapidPublicKey: () => config.vapid?.publicKey ?? null,
    savePushSubscription: (userId, input) => savePushSubscription(repos, userId, input),
    removePushSubscription: (userId, endpoint) => removePushSubscription(repos, userId, endpoint),
    registerWhatsapp: (userId, phone) =>
      registerWhatsapp(
        { whatsapp: repos.whatsapp, codes, clock, sender: verificationSender },
        userId,
        phone,
      ),
    verifyWhatsapp: (userId, code) =>
      verifyWhatsapp({ whatsapp: repos.whatsapp, clock }, userId, code),
    saveReminderPreference: (userId, input) =>
      saveReminderPreference(
        { reminders: repos.reminders, push: repos.push, whatsapp: repos.whatsapp },
        userId,
        input,
      ),
    getSettings: (userId) =>
      getNotificationSettings(
        { reminders: repos.reminders, push: repos.push, whatsapp: repos.whatsapp },
        userId,
      ),
    dispatchReminders: () =>
      dispatchReminders({ reminders: repos.reminders, targets, channels, content, clock }),
  };
}
