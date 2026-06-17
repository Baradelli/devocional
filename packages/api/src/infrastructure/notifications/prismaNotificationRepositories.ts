import type { PrismaClient } from '@prisma/client';

import type { NotificationTargetReader } from '../../application/notifications/dispatchReminders.js';
import type {
  ChannelTargets,
  NotificationRepositories,
  PushSubscriptionRepository,
  ReminderPreferenceRepository,
  WhatsappContactRepository,
} from '../../application/notifications/ports.js';

function createPushRepository(prisma: PrismaClient): PushSubscriptionRepository {
  return {
    async upsert(input) {
      await prisma.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        create: {
          userId: input.userId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
          label: input.label,
        },
        update: {
          userId: input.userId,
          p256dh: input.p256dh,
          auth: input.auth,
          label: input.label,
        },
      });
    },
    async removeByEndpoint(userId, endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    },
    async listByUser(userId) {
      const rows = await prisma.pushSubscription.findMany({
        where: { userId },
        select: { endpoint: true, p256dh: true, auth: true },
      });
      return rows;
    },
    countByUser(userId) {
      return prisma.pushSubscription.count({ where: { userId } });
    },
  };
}

function createWhatsappRepository(prisma: PrismaClient): WhatsappContactRepository {
  return {
    async register(data) {
      await prisma.whatsappContact.upsert({
        where: { userId: data.userId },
        create: {
          userId: data.userId,
          phone: data.phone,
          status: 'PENDING',
          verificationCode: data.verificationCode,
          codeExpiresAt: data.codeExpiresAt,
          verifiedAt: null,
        },
        update: {
          phone: data.phone,
          status: 'PENDING',
          verificationCode: data.verificationCode,
          codeExpiresAt: data.codeExpiresAt,
          verifiedAt: null,
        },
      });
    },
    async findByUser(userId) {
      const row = await prisma.whatsappContact.findUnique({ where: { userId } });
      return row
        ? {
            phone: row.phone,
            status: row.status,
            verificationCode: row.verificationCode,
            codeExpiresAt: row.codeExpiresAt,
          }
        : null;
    },
    async markVerified(userId, verifiedAt) {
      await prisma.whatsappContact.update({
        where: { userId },
        data: { status: 'VERIFIED', verifiedAt, verificationCode: null, codeExpiresAt: null },
      });
    },
  };
}

function createReminderRepository(prisma: PrismaClient): ReminderPreferenceRepository {
  return {
    async upsert(data) {
      await prisma.reminderPreference.upsert({
        where: { userId: data.userId },
        create: {
          userId: data.userId,
          localTime: data.localTime,
          pushEnabled: data.pushEnabled,
          whatsappEnabled: data.whatsappEnabled,
        },
        update: {
          localTime: data.localTime,
          pushEnabled: data.pushEnabled,
          whatsappEnabled: data.whatsappEnabled,
        },
      });
    },
    async findByUser(userId) {
      const row = await prisma.reminderPreference.findUnique({ where: { userId } });
      return row
        ? {
            localTime: row.localTime,
            pushEnabled: row.pushEnabled,
            whatsappEnabled: row.whatsappEnabled,
          }
        : null;
    },
    async listCandidates() {
      const rows = await prisma.reminderPreference.findMany({
        include: { user: { select: { timezone: true } } },
      });
      return rows.map((row) => ({
        userId: row.userId,
        timezone: row.user.timezone,
        localTime: row.localTime,
        pushEnabled: row.pushEnabled,
        whatsappEnabled: row.whatsappEnabled,
        lastSentLogicalDate: row.lastSentLogicalDate,
      }));
    },
    async markSent(userId, logicalDate) {
      await prisma.reminderPreference.update({
        where: { userId },
        data: { lastSentLogicalDate: logicalDate },
      });
    },
  };
}

export function createNotificationRepositories(prisma: PrismaClient): NotificationRepositories {
  return {
    push: createPushRepository(prisma),
    whatsapp: createWhatsappRepository(prisma),
    reminders: createReminderRepository(prisma),
  };
}

/** Agrega os alvos de entrega de um usuário (push + WhatsApp verificado). */
export function createNotificationTargetReader(prisma: PrismaClient): NotificationTargetReader {
  return {
    async getTargets(userId): Promise<ChannelTargets> {
      const [pushSubscriptions, whatsapp] = await Promise.all([
        prisma.pushSubscription.findMany({
          where: { userId },
          select: { endpoint: true, p256dh: true, auth: true },
        }),
        prisma.whatsappContact.findUnique({ where: { userId } }),
      ]);
      return {
        pushSubscriptions,
        whatsappPhone: whatsapp?.status === 'VERIFIED' ? whatsapp.phone : null,
      };
    },
  };
}
