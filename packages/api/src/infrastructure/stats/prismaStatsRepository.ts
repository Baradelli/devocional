import type { PrismaClient } from '@prisma/client';

import type {
  PassageRef,
  RulerBook,
  RulerVerseKey,
  StatsRepository,
} from '../../application/stats/ports.js';

export function createStatsRepository(prisma: PrismaClient): StatsRepository {
  return {
    async findRulerTranslationId(code) {
      const translation = await prisma.translation.findUnique({
        where: { code },
        select: { id: true },
      });
      return translation?.id ?? null;
    },

    async getRulerVerseKeys(translationId): Promise<RulerVerseKey[]> {
      const verses = await prisma.verse.findMany({
        where: { book: { translationId } },
        select: { chapter: true, verse: true, book: { select: { bookReferenceId: true } } },
      });
      return verses.map((v) => ({
        bookReferenceId: v.book.bookReferenceId,
        chapter: v.chapter,
        verse: v.verse,
      }));
    },

    async getRulerBooks(translationId): Promise<RulerBook[]> {
      return prisma.book.findMany({
        where: { translationId },
        select: { bookReferenceId: true, name: true },
      });
    },

    async getPassageReferences(): Promise<PassageRef[]> {
      return prisma.passageReference.findMany({
        select: { bookReferenceId: true, chapter: true, verseStart: true, verseEnd: true },
      });
    },

    countDevotionals() {
      return prisma.devotional.count();
    },

    countUsers() {
      return prisma.user.count();
    },

    getCompletionDaysSince(sinceDate) {
      return prisma.dailyCompletion.findMany({
        where: { logicalDate: { gte: sinceDate } },
        select: { userId: true, logicalDate: true },
      });
    },

    getStreakRows() {
      return prisma.streakState.findMany({
        select: { currentStreak: true, longestStreak: true },
      });
    },

    async getMostCompletedDevotionals(limit) {
      const groups = await prisma.dailyCompletion.groupBy({
        by: ['devotionalId'],
        where: { devotionalId: { not: null } },
        _count: { devotionalId: true },
        orderBy: { _count: { devotionalId: 'desc' } },
        take: limit,
      });
      const ids = groups.map((g) => g.devotionalId).filter((id): id is string => id !== null);
      if (ids.length === 0) {
        return [];
      }
      const devotionals = await prisma.devotional.findMany({
        where: { id: { in: ids } },
        select: { id: true, date: true, theme: true },
      });
      const byId = new Map(devotionals.map((d) => [d.id, d]));
      return groups.flatMap((g) => {
        if (g.devotionalId === null) {
          return [];
        }
        const devotional = byId.get(g.devotionalId);
        if (!devotional) {
          return [];
        }
        return [
          {
            devotionalId: g.devotionalId,
            date: devotional.date,
            theme: devotional.theme,
            completions: g._count.devotionalId,
          },
        ];
      });
    },
  };
}
