import type { PrismaClient } from '@prisma/client';

import {
  getPassagePreview,
  type PassagePreviewResult,
  type PassageQuery,
} from '../../application/bible/getPassage.js';
import type {
  BookRecord,
  ChapterSummary,
  ImportResult,
  ImportTranslationInput,
  TranslationRecord,
} from '../../application/bible/ports.js';
import { createBibleRepository } from './prismaBibleRepository.js';

export interface BibleModule {
  listTranslations(): Promise<TranslationRecord[]>;
  listBooks(translationId: string): Promise<BookRecord[]>;
  listChapters(bookId: string): Promise<ChapterSummary[]>;
  getPassagePreview(query: PassageQuery): Promise<PassagePreviewResult>;
  importTranslation(input: ImportTranslationInput): Promise<ImportResult>;
}

export function createBibleModule(prisma: PrismaClient): BibleModule {
  const repo = createBibleRepository(prisma);
  return {
    listTranslations: () => repo.listTranslations(),
    listBooks: (translationId) => repo.listBooks(translationId),
    listChapters: (bookId) => repo.listChapters(bookId),
    getPassagePreview: (query) => getPassagePreview(repo, query),
    importTranslation: (input) => repo.importTranslation(input),
  };
}
