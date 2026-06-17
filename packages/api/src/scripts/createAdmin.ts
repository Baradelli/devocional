import { emailSchema, nameSchema, passwordSchema, timezoneSchema } from '@devocional/shared';

import { loadEnv } from '../infrastructure/config/env.js';
import { createIdentityModule } from '../infrastructure/identity/identityModule.js';
import { createPrismaClient } from '../infrastructure/prisma/client.js';

/**
 * Bootstrap do primeiro admin (sistema fechado por convite). Uso:
 *   ADMIN_NAME=... ADMIN_EMAIL=... ADMIN_PASSWORD=... [ADMIN_TIMEZONE=...] \
 *     pnpm --filter @devocional/api exec tsx src/scripts/createAdmin.ts
 */
async function main(): Promise<void> {
  const env = loadEnv();
  const input = {
    name: nameSchema.parse(process.env.ADMIN_NAME),
    email: emailSchema.parse(process.env.ADMIN_EMAIL),
    password: passwordSchema.parse(process.env.ADMIN_PASSWORD),
    timezone: timezoneSchema.parse(process.env.ADMIN_TIMEZONE ?? 'America/Sao_Paulo'),
  };

  const prisma = createPrismaClient(env.DATABASE_URL);
  await prisma.$connect();
  try {
    const admin = await createIdentityModule(prisma).createAdminUser(input);
    process.stdout.write(`Admin criado: ${admin.email} (${admin.id})\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
