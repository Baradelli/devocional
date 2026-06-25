import {
  type Book,
  type Chapter,
  type PassagePreview,
  type PassageReference,
  type Translation,
} from '@devocional/shared';
import { useEffect, useRef, useState } from 'react';

import { getPassage, listBooks, listChapters, listTranslations } from '../api/bible.js';
import { ApiError } from '../api/client.js';
import { Banner } from '../ui/Banner.js';
import { Input, Select } from '../ui/controls.js';
import { Field } from '../ui/Field.js';

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
  initial,
}: {
  onChange: (reference: PassageReference | null) => void;
  initial?: PassageReference | null;
}) {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [translationId, setTranslationId] = useState(initial?.translationId ?? '');
  const [bookRef, setBookRef] = useState(initial ? String(initial.bookReferenceId) : '');
  const [chapter, setChapter] = useState(initial ? String(initial.chapter) : '');
  const [verseStart, setVerseStart] = useState(initial ? String(initial.verseStart) : '1');
  const [verseEnd, setVerseEnd] = useState(initial ? String(initial.verseEnd) : '1');
  const [preview, setPreview] = useState<PassagePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Na edição, os valores iniciais não devem ser zerados pelos efeitos de cascata.
  const hydratingTranslation = useRef(Boolean(initial));
  const hydratingBook = useRef(Boolean(initial));

  useEffect(() => {
    void listTranslations().then(setTranslations, (e: unknown) => setError(describeError(e)));
  }, []);

  useEffect(() => {
    if (hydratingTranslation.current) {
      hydratingTranslation.current = false;
    } else {
      setBookRef('');
      setChapter('');
    }
  }, [translationId]);

  useEffect(() => {
    setBooks([]);
    if (!translationId) {
      return;
    }
    void listBooks(translationId).then(setBooks, (e: unknown) => setError(describeError(e)));
  }, [translationId]);

  useEffect(() => {
    if (hydratingBook.current) {
      hydratingBook.current = false;
    } else {
      setChapter('');
    }
  }, [bookRef]);

  useEffect(() => {
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
      <div className="editor__row">
        <Field label="Tradução">
          <Select value={translationId} onChange={(e) => setTranslationId(e.target.value)}>
            <option value="">Escolha…</option>
            {translations.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} — {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Livro">
          <Select
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
          </Select>
        </Field>
      </div>
      <div className="editor__row">
        <Field label="Capítulo">
          <Select
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
          </Select>
        </Field>
        <div className="editor__row">
          <Field label="Vers. inicial">
            <Input
              type="number"
              min={1}
              value={verseStart}
              onChange={(e) => setVerseStart(e.target.value)}
            />
          </Field>
          <Field label="Vers. final">
            <Input
              type="number"
              min={1}
              value={verseEnd}
              onChange={(e) => setVerseEnd(e.target.value)}
            />
          </Field>
        </div>
      </div>
      {error && <Banner kind="error">{error}</Banner>}
      {preview && (
        <p className="passage-preview">
          <strong>{preview.label}</strong> — {preview.text}
        </p>
      )}
    </div>
  );
}
