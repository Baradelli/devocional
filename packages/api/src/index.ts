import { buildServer } from './delivery/server.js';
import { loadEnv } from './infrastructure/config/env.js';
import { createPrismaClient } from './infrastructure/prisma/client.js';

const env = loadEnv();
const prisma = createPrismaClient(env.DATABASE_URL);
const app = buildServer({ prisma, env });

async function start(): Promise<void> {
  await prisma.$connect();
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

async function shutdown(): Promise<void> {
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
