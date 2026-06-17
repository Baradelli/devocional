import {
  type Book,
  bookSchema,
  type Chapter,
  chapterSchema,
  type PassagePreview,
  passagePreviewSchema,
  type PassageReference,
  type Translation,
  translationSchema,
} from '@devocional/shared';
import { z } from 'zod';

import { apiRequest } from './client.js';

export function listTranslations(): Promise<Translation[]> {
  return apiRequest('/admin/bible/translations', z.array(translationSchema));
}

export function listBooks(translationId: string): Promise<Book[]> {
  return apiRequest(`/admin/bible/translations/${translationId}/books`, z.array(bookSchema));
}

export function listChapters(bookId: string): Promise<Chapter[]> {
  return apiRequest(`/admin/bible/books/${bookId}/chapters`, z.array(chapterSchema));
}

export function getPassage(reference: PassageReference): Promise<PassagePreview> {
  const query = new URLSearchParams({
    translationId: reference.translationId,
    bookReferenceId: String(reference.bookReferenceId),
    chapter: String(reference.chapter),
    verseStart: String(reference.verseStart),
    verseEnd: String(reference.verseEnd),
  });
  return apiRequest(`/admin/bible/passage?${query.toString()}`, passagePreviewSchema);
}
