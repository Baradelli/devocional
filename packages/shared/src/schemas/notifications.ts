import { z } from 'zod';

/**
 * Schemas de notificações multi-canal. O servidor agenda e dispara (ADR-002);
 * cada canal (Web Push, WhatsApp) é best-effort e ativável de forma
 * independente. Sem mensagens PT-BR aqui (mapeadas na apresentação).
 */

/** Horário local do lembrete, "HH:MM" em 24h. */
export const localTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** Subscription do Web Push (formato do PushSubscription.toJSON do browser). */
export const pushSubscriptionInputSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  label: z.string().max(120).optional(),
});
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInputSchema>;

/** Número em E.164 (ex.: +5511999998888). */
export const whatsappRegisterSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
});
export type WhatsappRegisterInput = z.infer<typeof whatsappRegisterSchema>;

export const whatsappVerifySchema = z.object({
  code: z.string().min(4).max(12),
});
export type WhatsappVerifyInput = z.infer<typeof whatsappVerifySchema>;

export const reminderPreferenceInputSchema = z.object({
  localTime: localTimeSchema,
  pushEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
});
export type ReminderPreferenceInput = z.infer<typeof reminderPreferenceInputSchema>;

export const whatsappStatusSchema = z.enum(['NONE', 'PENDING', 'VERIFIED']);
export type WhatsappStatusValue = z.infer<typeof whatsappStatusSchema>;

/** Estado das notificações do usuário para a tela de lembretes. */
export const notificationSettingsSchema = z.object({
  reminder: z
    .object({
      localTime: z.string(),
      pushEnabled: z.boolean(),
      whatsappEnabled: z.boolean(),
    })
    .nullable(),
  pushDevices: z.number().int().nonnegative(),
  whatsapp: z.object({
    status: whatsappStatusSchema,
    phone: z.string().nullable(),
  }),
});
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

export const vapidPublicKeySchema = z.object({ publicKey: z.string() });
export type VapidPublicKey = z.infer<typeof vapidPublicKeySchema>;

export const notificationOkSchema = z.object({ ok: z.boolean() });

/** Resultado de uma notificação de teste: quantos aparelhos receberam. */
export const notificationTestResultSchema = z.object({
  delivered: z.number().int().nonnegative(),
});
export type NotificationTestResult = z.infer<typeof notificationTestResultSchema>;
