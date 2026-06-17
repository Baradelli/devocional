import type { PrismaClient } from '@prisma/client';

import type { BibleRepository } from '../../application/bible/ports.js';

export function createBibleRepository(prisma: PrismaClient): BibleRepository {
  return {
    listTranslations: () =>
      prisma.translation.findMany({
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true },
      }),

    listBooks: (translationId) =>
      prisma.book.findMany({
        where: { translationId },
        orderBy: { bookReferenceId: 'asc' },
        select: { id: true, bookReferenceId: true, testamentReferenceId: true, name: true },
      }),

    async listChapters(bookId) {
      const groups = await prisma.verse.groupBy({
        by: ['chapter'],
        where: { bookId },
        _count: { verse: true },
        orderBy: { chapter: 'asc' },
      });
      return groups.map((g) => ({ chapter: g.chapter, verseCount: g._count.verse }));
    },

    findBook: (translationId, bookReferenceId) =>
      prisma.book.findUnique({
        where: { translationId_bookReferenceId: { translationId, bookReferenceId } },
        select: { id: true, bookReferenceId: true, testamentReferenceId: true, name: true },
      }),

    getVerses: (bookId, chapter, verseStart, verseEnd) =>
      prisma.verse.findMany({
        where: { bookId, chapter, verse: { gte: verseStart, lte: verseEnd } },
        orderBy: { verse: 'asc' },
        select: { verse: true, text: true },
      }),

    async importTranslation(input) {
      const translation = await prisma.translation.upsert({
        where: { code: input.code },
        create: { code: input.code, name: input.name },
        update: { name: input.name },
      });

      let insertedVerseCount = 0;
      for (const book of input.books) {
        const stored = await prisma.book.upsert({
          where: {
            translationId_bookReferenceId: {
              translationId: translation.id,
              bookReferenceId: book.bookReferenceId,
            },
          },
          create: {
            translationId: translation.id,
            bookReferenceId: book.bookReferenceId,
            testamentReferenceId: book.testamentReferenceId,
            name: book.name,
          },
          update: { name: book.name, testamentReferenceId: book.testamentReferenceId },
        });

        if (book.verses.length > 0) {
          const result = await prisma.verse.createMany({
            data: book.verses.map((v) => ({
              bookId: stored.id,
              chapter: v.chapter,
              verse: v.verse,
              text: v.text,
            })),
            skipDuplicates: true,
          });
          insertedVerseCount += result.count;
        }
      }

      return {
        translationId: translation.id,
        bookCount: input.books.length,
        insertedVerseCount,
      };
    },
  };
}
