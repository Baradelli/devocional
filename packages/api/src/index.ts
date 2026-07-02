import cron from 'node-cron';

import { buildServer } from './delivery/server.js';
import { loadEnv } from './infrastructure/config/env.js';
import { createNotificationsModule } from './infrastructure/notifications/notificationsModule.js';
import { createLogAlerter } from './infrastructure/observability/alerter.js';
import { createPrismaClient } from './infrastructure/prisma/client.js';

const env = loadEnv();
const prisma = createPrismaClient(env.DATABASE_URL);
const app = buildServer({ prisma, env });
const alerter = createLogAlerter(app.log);

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
  await app.listen({ port: env.PORT, host: env.HOST });
}

async function shutdown(): Promise<void> {
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
