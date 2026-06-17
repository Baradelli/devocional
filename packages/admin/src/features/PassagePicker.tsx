import {
  type Book,
  type Chapter,
  type PassagePreview,
  type PassageReference,
  type Translation,
} from '@devocional/shared';
import { useEffect, useState } from 'react';

import { getPassage, listBooks, listChapters, listTranslations } from '../api/bible.js';
import { ApiError } from '../api/client.js';

const TESTAMENT_LABELS: Record<number, string> = {
  1: 'Antigo Testamento',
  2: 'Novo Testamento',
};

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Erro ao consultar a Bíblia.';
}

/** Seletor encadeado tradução → livro → capítulo → range; emite a referência. */
export function PassagePicker({
  onChange,
}: {
  onChange: (reference: PassageReference | null) => void;
}) {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [translationId, setTranslationId] = useState('');
  const [bookRef, setBookRef] = useState('');
  const [chapter, setChapter] = useState('');
  const [verseStart, setVerseStart] = useState('1');
  const [verseEnd, setVerseEnd] = useState('1');
  const [preview, setPreview] = useState<PassagePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listTranslations().then(setTranslations, (e: unknown) => setError(describeError(e)));
  }, []);

  useEffect(() => {
    setBookRef('');
    setBooks([]);
    setChapters([]);
    if (!translationId) {
      return;
    }
    void listBooks(translationId).then(setBooks, (e: unknown) => setError(describeError(e)));
  }, [translationId]);

  useEffect(() => {
    setChapter('');
    const book = books.find((b) => String(b.bookReferenceId) === bookRef);
    if (!book) {
      setChapters([]);
      return;
    }
    void listChapters(book.id).then(setChapters, (e: unknown) => setError(describeError(e)));
  }, [bookRef, books]);

  useEffect(() => {
    const vs = Number(verseStart);
    const ve = Number(verseEnd);
    if (!translationId || !bookRef || !chapter || !vs || !ve || ve < vs) {
      onChange(null);
      setPreview(null);
      return;
    }
    const reference: PassageReference = {
      translationId,
      bookReferenceId: Number(bookRef),
      chapter: Number(chapter),
      verseStart: vs,
      verseEnd: ve,
    };
    onChange(reference);
    setError(null);
    void getPassage(reference).then(setPreview, () => setPreview(null));
    // onChange é omitido das deps de propósito (identidade muda a cada render).
  }, [translationId, bookRef, chapter, verseStart, verseEnd]);

  const byTestament = books.reduce<Record<number, Book[]>>((groups, book) => {
    (groups[book.testamentReferenceId] ??= []).push(book);
    return groups;
  }, {});

  return (
    <div className="passage-picker">
      <div className="selector">
        <label>
          Tradução
          <select value={translationId} onChange={(e) => setTranslationId(e.target.value)}>
            <option value="">Escolha…</option>
            {translations.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} — {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Livro
          <select
            value={bookRef}
            onChange={(e) => setBookRef(e.target.value)}
            disabled={books.length === 0}
          >
            <option value="">Escolha…</option>
            {Object.entries(byTestament).map(([testament, group]) => (
              <optgroup key={testament} label={TESTAMENT_LABELS[Number(testament)] ?? 'Outros'}>
                {group.map((book) => (
                  <option key={book.id} value={book.bookReferenceId}>
                    {book.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          Capítulo
          <select
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            disabled={chapters.length === 0}
          >
            <option value="">Escolha…</option>
            {chapters.map((c) => (
              <option key={c.chapter} value={c.chapter}>
                {c.chapter} ({c.verseCount} v.)
              </option>
            ))}
          </select>
        </label>
        <div className="range">
          <label>
            Vers. inicial
            <input
              type="number"
              min={1}
              value={verseStart}
              onChange={(e) => setVerseStart(e.target.value)}
            />
          </label>
          <label>
            Vers. final
            <input
              type="number"
              min={1}
              value={verseEnd}
              onChange={(e) => setVerseEnd(e.target.value)}
            />
          </label>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      {preview && (
        <p className="preview">
          <strong>{preview.label}</strong> — {preview.text}
        </p>
      )}
    </div>
  );
}
