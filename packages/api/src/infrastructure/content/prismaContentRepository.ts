import { Prisma, type PrismaClient } from '@prisma/client';

import { ContentError } from '../../application/content/errors.js';
import type {
  BlockRecord,
  CreateBlockData,
  CreateDevotionalData,
  DevotionalRecord,
  DevotionalRepository,
  PassageRefData,
} from '../../application/content/ports.js';

type BlockWithPassage = Prisma.DevotionalBlockGetPayload<{ include: { passage: true } }>;

/** Mapeia um bloco de domínio para o input de criação aninhada do Prisma. */
function toBlockCreateInput(
  block: CreateBlockData,
): Prisma.DevotionalBlockCreateWithoutDevotionalInput {
  return {
    type: block.type,
    order: block.order,
    text: block.text,
    audioMediaId: block.audioMediaId,
    gifMediaId: block.gifMediaId,
    soundMediaId: block.soundMediaId,
    reflectionQuestions: block.reflectionQuestions,
    reflectionActions: block.reflectionActions,
    passage: block.passage ? { create: block.passage } : undefined,
  };
}

function toPassageRef(passage: BlockWithPassage['passage']): PassageRefData | null {
  if (!passage) {
    return null;
  }
  return {
    translationId: passage.translationId,
    bookReferenceId: passage.bookReferenceId,
    chapter: passage.chapter,
    verseStart: passage.verseStart,
    verseEnd: passage.verseEnd,
  };
}

function toBlockRecord(block: BlockWithPassage): BlockRecord {
  return {
    type: block.type,
    order: block.order,
    text: block.text,
    audioMediaId: block.audioMediaId,
    gifMediaId: block.gifMediaId,
    soundMediaId: block.soundMediaId,
    reflectionQuestions: block.reflectionQuestions,
    reflectionActions: block.reflectionActions,
    passage: toPassageRef(block.passage),
  };
}

export function createContentRepository(prisma: PrismaClient): DevotionalRepository {
  return {
    async create(data: CreateDevotionalData) {
      try {
        await prisma.devotional.create({
          data: {
            date: data.date,
            theme: data.theme,
            blocks: { create: data.blocks.map(toBlockCreateInput) },
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ContentError('DEVOTIONAL_EXISTS');
        }
        throw error;
      }
    },

    update(date, data) {
      // Reescreve o conjunto inteiro de blocos atomicamente; a data não é
      // tocada. Apagar os blocos remove as passagens em cascata.
      return prisma.$transaction(async (tx) => {
        const existing = await tx.devotional.findUnique({
          where: { date },
          select: { id: true },
        });
        if (!existing) {
          throw new ContentError('DEVOTIONAL_NOT_FOUND');
        }
        await tx.devotionalBlock.deleteMany({ where: { devotionalId: existing.id } });
        const updated = await tx.devotional.update({
          where: { id: existing.id },
          data: {
            theme: data.theme,
            blocks: { create: data.blocks.map(toBlockCreateInput) },
          },
          select: { date: true, theme: true },
        });
        return updated;
      });
    },

    async findByDate(date): Promise<DevotionalRecord | null> {
      const devotional = await prisma.devotional.findUnique({
        where: { date },
        include: { blocks: { orderBy: { order: 'asc' }, include: { passage: true } } },
      });
      if (!devotional) {
        return null;
      }
      return {
        id: devotional.id,
        date: devotional.date,
        theme: devotional.theme,
        blocks: devotional.blocks.map(toBlockRecord),
      };
    },

    listSummaries: () =>
      prisma.devotional.findMany({
        orderBy: { date: 'desc' },
        select: { date: true, theme: true },
      }),
  };
}
