import { Prisma, type PrismaClient } from '@prisma/client';

import { ContentError } from '../../application/content/errors.js';
import type {
  BlockRecord,
  CreateDevotionalData,
  DevotionalRecord,
  DevotionalRepository,
  PassageRefData,
} from '../../application/content/ports.js';

type BlockWithPassage = Prisma.DevotionalBlockGetPayload<{ include: { passage: true } }>;

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
            blocks: {
              create: data.blocks.map((block) => ({
                type: block.type,
                order: block.order,
                text: block.text,
                audioMediaId: block.audioMediaId,
                gifMediaId: block.gifMediaId,
                soundMediaId: block.soundMediaId,
                reflectionQuestions: block.reflectionQuestions,
                reflectionActions: block.reflectionActions,
                passage: block.passage ? { create: block.passage } : undefined,
              })),
            },
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ContentError('DEVOTIONAL_EXISTS');
        }
        throw error;
      }
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
        date: devotional.date,
        theme: devotional.theme,
        publishedAt: devotional.publishedAt,
        blocks: devotional.blocks.map(toBlockRecord),
      };
    },

    listSummaries: () =>
      prisma.devotional.findMany({
        orderBy: { date: 'desc' },
        select: { date: true, theme: true, publishedAt: true },
      }),

    async publishDue(today, publishedAt) {
      const result = await prisma.devotional.updateMany({
        where: { publishedAt: null, date: { lte: today } },
        data: { publishedAt },
      });
      return result.count;
    },
  };
}
