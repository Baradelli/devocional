import { assemblePassageText, formatReferenceLabel } from '../../domain/bible/passage.js';
import { BibleError } from './errors.js';
import type { BibleRepository } from './ports.js';

export interface PassageQuery {
  translationId: string;
  bookReferenceId: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

export interface PassagePreviewResult {
  reference: PassageQuery;
  label: string;
  bookName: string;
  verses: { verse: number; text: string }[];
  text: string;
}

/**
 * Resolve a referência canônica e monta o texto da passagem (preview do admin
 * e base da exibição ao fiel). O texto é derivado da tabela `Verse` (ADR-006).
 */
export async function getPassagePreview(
  repo: BibleRepository,
  query: PassageQuery,
): Promise<PassagePreviewResult> {
  const book = await repo.findBook(query.translationId, query.bookReferenceId);
  if (!book) {
    throw new BibleError('BOOK_NOT_FOUND');
  }

  const verses = await repo.getVerses(book.id, query.chapter, query.verseStart, query.verseEnd);
  if (verses.length === 0) {
    throw new BibleError('PASSAGE_EMPTY');
  }

  return {
    reference: query,
    label: formatReferenceLabel(book.name, query.chapter, query.verseStart, query.verseEnd),
    bookName: book.name,
    verses,
    text: assemblePassageText(verses),
  };
}
