import type { NotificationSettings, ReminderPreferenceInput } from '@devocional/shared';

import type {
  PushSubscriptionRepository,
  ReminderPreferenceRepository,
  WhatsappContactRepository,
} from './ports.js';

export interface ReminderSettingsDeps {
  reminders: ReminderPreferenceRepository;
  push: PushSubscriptionRepository;
  whatsapp: WhatsappContactRepository;
}

export async function saveReminderPreference(
  deps: ReminderSettingsDeps,
  userId: string,
  input: ReminderPreferenceInput,
): Promise<void> {
  await deps.reminders.upsert({
    userId,
    localTime: input.localTime,
    pushEnabled: input.pushEnabled,
    whatsappEnabled: input.whatsappEnabled,
  });
}

export async function getNotificationSettings(
  deps: ReminderSettingsDeps,
  userId: string,
): Promise<NotificationSettings> {
  const [reminder, pushDevices, whatsapp] = await Promise.all([
    deps.reminders.findByUser(userId),
    deps.push.countByUser(userId),
    deps.whatsapp.findByUser(userId),
  ]);

  return {
    reminder: reminder
      ? {
          localTime: reminder.localTime,
          pushEnabled: reminder.pushEnabled,
          whatsappEnabled: reminder.whatsappEnabled,
        }
      : null,
    pushDevices,
    whatsapp: {
      status: whatsapp?.status ?? 'NONE',
      phone: whatsapp?.phone ?? null,
    },
  };
}
