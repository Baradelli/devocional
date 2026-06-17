import type { PrismaClient } from '@prisma/client';

import type { MediaRepository } from '../../application/content/ports.js';

export function createMediaRepository(prisma: PrismaClient): MediaRepository {
  return {
    create: (input) => prisma.media.create({ data: input }),
    findById: (id) => prisma.media.findUnique({ where: { id } }),
  };
}
