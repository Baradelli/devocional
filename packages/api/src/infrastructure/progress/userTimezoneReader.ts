import type { PrismaClient } from '@prisma/client';

import type { UserTimezoneReader } from '../../application/progress/ports.js';

export function createUserTimezoneReader(prisma: PrismaClient): UserTimezoneReader {
  return {
    async findTimezone(userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      });
      return user?.timezone ?? null;
    },
  };
}
