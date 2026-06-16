import cron from 'node-cron';

import { buildServer } from './delivery/server.js';
import { createBibleModule } from './infrastructure/bible/bibleModule.js';
import { loadEnv } from './infrastructure/config/env.js';
import { createContentModule } from './infrastructure/content/contentModule.js';
import { createPrismaClient } from './infrastructure/prisma/client.js';

const env = loadEnv();
const prisma = createPrismaClient(env.DATABASE_URL);
const app = buildServer({ prisma, env });

const content = createContentModule(prisma, createBibleModule(prisma), {
  mediaDir: env.MEDIA_DIR,
  serverTimezone: env.SERVER_TIMEZONE,
});

async function publishDue(): Promise<void> {
  try {
    const published = await content.publishDue();
    if (published > 0) {
      app.log.info({ published }, 'devotionals published');
    }
  } catch (error) {
    // Job crítico: falha não pode passar silenciosa (ver design §4).
    app.log.error(error, 'devotional publication job failed');
  }
}

// Virada do dia: publica o conteúdo cuja data chegou, no fuso do servidor.
const publishJob = cron.schedule('0 0 * * *', () => void publishDue(), {
  timezone: env.SERVER_TIMEZONE,
});

async function start(): Promise<void> {
  await prisma.$connect();
  await publishDue(); // publica pendências ao subir
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

async function shutdown(): Promise<void> {
  publishJob.stop();
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
