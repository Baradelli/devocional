import type { VerseText } from '../../domain/bible/passage.js';

export interface TranslationRecord {
  id: string;
  code: string;
  name: string;
}

export interface BookRecord {
  id: string;
  bookReferenceId: number;
  testamentReferenceId: number;
  name: string;
}

export interface ChapterSummary {
  chapter: number;
  verseCount: number;
}

export interface ImportBookInput {
  bookReferenceId: number;
  testamentReferenceId: number;
  name: string;
  verses: { chapter: number; verse: number; text: string }[];
}

export interface ImportTranslationInput {
  code: string;
  name: string;
  books: ImportBookInput[];
}

export interface ImportResult {
  translationId: string;
  bookCount: number;
  insertedVerseCount: number;
}

export interface BibleRepository {
  listTranslations(): Promise<TranslationRecord[]>;
  listBooks(translationId: string): Promise<BookRecord[]>;
  listChapters(bookId: string): Promise<ChapterSummary[]>;
  findBook(translationId: string, bookReferenceId: number): Promise<BookRecord | null>;
  getVerses(
    bookId: string,
    chapter: number,
    verseStart: number,
    verseEnd: number,
  ): Promise<VerseText[]>;
  /** Importação idempotente: reexecutar não duplica livros nem versículos. */
  importTranslation(input: ImportTranslationInput): Promise<ImportResult>;
}
