import type { Prisma, PrismaClient } from '@prisma/client';

import type { NoteRecord, NoteRepository } from '../../application/notes/ports.js';

type PrismaLike = Pick<PrismaClient, 'note' | 'devotional'>;

type NoteRow = {
  devotionalId: string;
  text: string;
  deletedAt: Date | null;
  editedAt: Date;
  idempotencyKey: string;
  updatedAt: Date;
  devotional: { date: string };
};

function toRecord(row: NoteRow): NoteRecord {
  return {
    devotionalId: row.devotionalId,
    date: row.devotional.date,
    text: row.text,
    deleted: row.deletedAt !== null,
    editedAt: row.editedAt,
    idempotencyKey: row.idempotencyKey,
    updatedAt: row.updatedAt,
  };
}

const withDate = { devotional: { select: { date: true } } } as const;

export function createNoteRepository(db: PrismaLike): NoteRepository {
  return {
    async findDevotionalDate(devotionalId) {
      const row = await db.devotional.findUnique({
        where: { id: devotionalId },
        select: { date: true },
      });
      return row?.date ?? null;
    },

    async findByUserAndDevotional(userId, devotionalId) {
      const row = await db.note.findUnique({
        where: { userId_devotionalId: { userId, devotionalId } },
        include: withDate,
      });
      return row ? toRecord(row) : null;
    },

    async findActiveByUserAndDevotional(userId, devotionalId) {
      const row = await db.note.findUnique({
        where: { userId_devotionalId: { userId, devotionalId } },
        include: withDate,
      });
      return row && row.deletedAt === null ? toRecord(row) : null;
    },

    async upsert(input) {
      const deletedAt = input.deleted ? input.editedAt : null;
      const row = await db.note.upsert({
        where: { userId_devotionalId: { userId: input.userId, devotionalId: input.devotionalId } },
        create: {
          userId: input.userId,
          devotionalId: input.devotionalId,
          text: input.text,
          idempotencyKey: input.idempotencyKey,
          editedAt: input.editedAt,
          deletedAt,
        },
        update: {
          text: input.text,
          idempotencyKey: input.idempotencyKey,
          editedAt: input.editedAt,
          deletedAt,
        },
        include: withDate,
      });
      return toRecord(row);
    },

    async listByUser(userId) {
      const rows = await db.note.findMany({
        where: { userId, deletedAt: null },
        include: withDate,
        orderBy: { devotional: { date: 'desc' } },
      });
      return rows.map(toRecord);
    },
  };
}

export function createNoteUnitOfWork(prisma: PrismaClient) {
  return {
    run: <T>(work: (repo: NoteRepository) => Promise<T>): Promise<T> =>
      prisma.$transaction((tx: Prisma.TransactionClient) => work(createNoteRepository(tx))),
  };
}
