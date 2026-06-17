import cron from 'node-cron';

import { buildServer } from './delivery/server.js';
import { createBibleModule } from './infrastructure/bible/bibleModule.js';
import { loadEnv } from './infrastructure/config/env.js';
import { createContentModule } from './infrastructure/content/contentModule.js';
import { createNotificationsModule } from './infrastructure/notifications/notificationsModule.js';
import { createLogAlerter } from './infrastructure/observability/alerter.js';
import { createPrismaClient } from './infrastructure/prisma/client.js';

const env = loadEnv();
const prisma = createPrismaClient(env.DATABASE_URL);
const app = buildServer({ prisma, env });
const alerter = createLogAlerter(app.log);

const content = createContentModule(prisma, createBibleModule(prisma), {
  mediaDir: env.MEDIA_DIR,
  serverTimezone: env.SERVER_TIMEZONE,
});

const notifications = createNotificationsModule(
  prisma,
  {
    vapid:
      env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY
        ? {
            subject: env.VAPID_SUBJECT,
            publicKey: env.VAPID_PUBLIC_KEY,
            privateKey: env.VAPID_PRIVATE_KEY,
          }
        : null,
    appUrl: env.APP_URL,
  },
  app.log,
  alerter,
);

async function publishDue(): Promise<void> {
  try {
    const published = await content.publishDue();
    if (published > 0) {
      app.log.info({ published }, 'devotionals published');
    }
  } catch (error) {
    // Job crítico: falha não pode passar silenciosa (ver design §4).
    alerter.alert({
      event: 'PUBLISH_JOB_FAILED',
      severity: 'critical',
      message: 'devotional publication job failed',
      cause: error,
    });
  }
}

// Virada do dia: publica o conteúdo cuja data chegou, no fuso do servidor.
const publishJob = cron.schedule('0 0 * * *', () => void publishDue(), {
  timezone: env.SERVER_TIMEZONE,
});

async function dispatchReminders(): Promise<void> {
  try {
    const summary = await notifications.dispatchReminders();
    if (summary.dispatched > 0) {
      app.log.info(summary, 'reminders dispatched');
    }
  } catch (error) {
    // Job crítico: falha não pode passar silenciosa (ver design §observabilidade).
    alerter.alert({
      event: 'REMINDER_JOB_FAILED',
      severity: 'critical',
      message: 'reminder dispatch job failed',
      cause: error,
    });
  }
}

// Lembretes: a cada minuto, dispara para quem o horário local já chegou.
const reminderJob = cron.schedule('* * * * *', () => void dispatchReminders());

async function start(): Promise<void> {
  await prisma.$connect();
  await publishDue(); // publica pendências ao subir
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

async function shutdown(): Promise<void> {
  publishJob.stop();
  reminderJob.stop();
  await app.close();
  await prisma.$disconnect();
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    shutdown()
      .catch((error: unknown) => app.log.error(error))
      .finally(() => process.exit(0));
  });
}

start().catch((error: unknown) => {
  app.log.error(error);
  process.exit(1);
});
