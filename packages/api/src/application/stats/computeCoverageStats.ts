import type { CoverageStats, SectionKey, Testament } from '@devocional/shared';

import { formatReferenceLabel } from '../../domain/bible/passage.js';
import { SECTION_KEYS, sectionOf, testamentOf } from '../../domain/stats/canon.js';
import { StatsError } from './errors.js';
import type { StatsRepository } from './ports.js';

const TOP_N = 5;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Cobertura da Bíblia pelos devocionais (curadoria do autor), medida contra a
 * tradução-régua. Dedup por (livro, capítulo, versículo); um versículo só conta
 * se existe na régua. Ranges são expandidos. Funções de cânon agrupam por
 * testamento e seção.
 */
export async function computeCoverageStats(
  repo: StatsRepository,
  rulerCode: string,
): Promise<CoverageStats> {
  const translationId = await repo.findRulerTranslationId(rulerCode);
  if (!translationId) {
    throw new StatsError('RULER_TRANSLATION_NOT_FOUND');
  }

  const [verseKeys, rulerBooks, passages, devotionalCount] = await Promise.all([
    repo.getRulerVerseKeys(translationId),
    repo.getRulerBooks(translationId),
    repo.getPassageReferences(),
    repo.countDevotionals(),
  ]);

  const verseKey = (book: number, chapter: number, verse: number) => `${book}:${chapter}:${verse}`;
  const chapterKey = (book: number, chapter: number) => `${book}:${chapter}`;

  // Régua: conjunto de versículos + totais por livro e por capítulo.
  const rulerSet = new Set<string>();
  const bookTotal = new Map<number, number>();
  const chapterTotal = new Map<string, number>();
  const bookChapters = new Map<number, Set<number>>();
  for (const k of verseKeys) {
    rulerSet.add(verseKey(k.bookReferenceId, k.chapter, k.verse));
    bookTotal.set(k.bookReferenceId, (bookTotal.get(k.bookReferenceId) ?? 0) + 1);
    const ck = chapterKey(k.bookReferenceId, k.chapter);
    chapterTotal.set(ck, (chapterTotal.get(ck) ?? 0) + 1);
    let chapters = bookChapters.get(k.bookReferenceId);
    if (!chapters) {
      chapters = new Set<number>();
      bookChapters.set(k.bookReferenceId, chapters);
    }
    chapters.add(k.chapter);
  }
  const totalVerses = rulerSet.size;

  // Passagens: cobertura distinta + contagens de citação.
  const covered = new Set<string>();
  const coveredBook = new Map<number, number>();
  const coveredChapter = new Map<string, number>();
  const citationsBook = new Map<number, number>();
  const citationsChapter = new Map<string, number>();
  const citationsPassage = new Map<
    string,
    { book: number; chapter: number; verseStart: number; verseEnd: number; count: number }
  >();
  let oldDevotionals = 0;
  let newDevotionals = 0;

  for (const p of passages) {
    citationsBook.set(p.bookReferenceId, (citationsBook.get(p.bookReferenceId) ?? 0) + 1);
    const ck = chapterKey(p.bookReferenceId, p.chapter);
    citationsChapter.set(ck, (citationsChapter.get(ck) ?? 0) + 1);
    const pk = `${p.bookReferenceId}:${p.chapter}:${p.verseStart}:${p.verseEnd}`;
    const existing = citationsPassage.get(pk);
    if (existing) {
      existing.count += 1;
    } else {
      citationsPassage.set(pk, {
        book: p.bookReferenceId,
        chapter: p.chapter,
        verseStart: p.verseStart,
        verseEnd: p.verseEnd,
        count: 1,
      });
    }

    for (let v = p.verseStart; v <= p.verseEnd; v += 1) {
      const key = verseKey(p.bookReferenceId, p.chapter, v);
      if (rulerSet.has(key) && !covered.has(key)) {
        covered.add(key);
        coveredBook.set(p.bookReferenceId, (coveredBook.get(p.bookReferenceId) ?? 0) + 1);
        coveredChapter.set(ck, (coveredChapter.get(ck) ?? 0) + 1);
      }
    }

    if (testamentOf(p.bookReferenceId) === 'OLD') {
      oldDevotionals += 1;
    } else {
      newDevotionals += 1;
    }
  }

  const bookNames = new Map(rulerBooks.map((b) => [b.bookReferenceId, b.name]));

  const books = [...rulerBooks]
    .sort((a, b) => a.bookReferenceId - b.bookReferenceId)
    .map((book) => {
      const chapters = [...(bookChapters.get(book.bookReferenceId) ?? [])]
        .sort((a, b) => a - b)
        .map((chapter) => {
          const ck = chapterKey(book.bookReferenceId, chapter);
          return {
            chapter,
            totalVerses: chapterTotal.get(ck) ?? 0,
            coveredVerses: coveredChapter.get(ck) ?? 0,
            citations: citationsChapter.get(ck) ?? 0,
          };
        });
      return {
        bookReferenceId: book.bookReferenceId,
        name: book.name,
        testament: testamentOf(book.bookReferenceId),
        totalVerses: bookTotal.get(book.bookReferenceId) ?? 0,
        coveredVerses: coveredBook.get(book.bookReferenceId) ?? 0,
        citations: citationsBook.get(book.bookReferenceId) ?? 0,
        chapters,
      };
    });

  const emptyGroup = (devotionalCount: number) => ({
    coveredVerses: 0,
    totalVerses: 0,
    devotionalCount,
  });
  const testaments: Record<
    Testament,
    { coveredVerses: number; totalVerses: number; devotionalCount: number }
  > = {
    OLD: emptyGroup(oldDevotionals),
    NEW: emptyGroup(newDevotionals),
  };
  for (const book of books) {
    testaments[book.testament].coveredVerses += book.coveredVerses;
    testaments[book.testament].totalVerses += book.totalVerses;
  }

  const sections = SECTION_KEYS.map((key: SectionKey) => {
    const inSection = books.filter((b) => sectionOf(b.bookReferenceId) === key);
    return {
      key,
      coveredVerses: inSection.reduce((sum, b) => sum + b.coveredVerses, 0),
      totalVerses: inSection.reduce((sum, b) => sum + b.totalVerses, 0),
      devotionalCount: inSection.reduce((sum, b) => sum + b.citations, 0),
    };
  });

  const topBooks = books
    .filter((b) => b.citations > 0)
    .sort((a, b) => b.citations - a.citations || a.bookReferenceId - b.bookReferenceId)
    .slice(0, TOP_N)
    .map((b) => ({ bookReferenceId: b.bookReferenceId, name: b.name, citations: b.citations }));

  const topPassages = [...citationsPassage.values()]
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.book - b.book ||
        a.chapter - b.chapter ||
        a.verseStart - b.verseStart,
    )
    .slice(0, TOP_N)
    .map((p) => ({
      label: formatReferenceLabel(
        bookNames.get(p.book) ?? `Livro ${String(p.book)}`,
        p.chapter,
        p.verseStart,
        p.verseEnd,
      ),
      bookReferenceId: p.book,
      chapter: p.chapter,
      verseStart: p.verseStart,
      verseEnd: p.verseEnd,
      citations: p.count,
    }));

  const unusedBooks = books
    .filter((b) => b.citations === 0)
    .map((b) => ({ bookReferenceId: b.bookReferenceId, name: b.name }));

  return {
    rulerTranslationCode: rulerCode,
    totalVerses,
    coveredVerses: covered.size,
    coveragePct: totalVerses === 0 ? 0 : round1((covered.size / totalVerses) * 100),
    devotionalCount,
    testaments,
    sections,
    books,
    topBooks,
    topPassages,
    unusedBooks,
  };
}
