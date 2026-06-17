import {
  type Book,
  type Chapter,
  type PassagePreview,
  type PassageReference,
  passageReferenceSchema,
  type Translation,
} from '@devocional/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { type Resolver, useForm } from 'react-hook-form';

import { getPassage, listBooks, listChapters, listTranslations } from '../api/bible.js';
import { ApiError } from '../api/client.js';

interface PassageFormValues {
  translationId: string;
  bookReferenceId: string;
  chapter: string;
  verseStart: string;
  verseEnd: string;
}

const TESTAMENT_LABELS: Record<number, string> = {
  1: 'Antigo Testamento',
  2: 'Novo Testamento',
};

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Algo deu errado ao consultar a Bíblia.';
}

export function PassageSelector() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [preview, setPreview] = useState<PassagePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PassageFormValues>({
    resolver: zodResolver(passageReferenceSchema) as unknown as Resolver<PassageFormValues>,
    defaultValues: {
      translationId: '',
      bookReferenceId: '',
      chapter: '',
      verseStart: '1',
      verseEnd: '1',
    },
  });

  const translationId = watch('translationId');
  const bookReferenceId = watch('bookReferenceId');

  useEffect(() => {
    void listTranslations().then(setTranslations, (e: unknown) => setError(describeError(e)));
  }, []);

  useEffect(() => {
    setValue('bookReferenceId', '');
    setValue('chapter', '');
    setChapters([]);
    setPreview(null);
    if (!translationId) {
      setBooks([]);
      return;
    }
    void listBooks(translationId).then(setBooks, (e: unknown) => setError(describeError(e)));
  }, [translationId, setValue]);

  useEffect(() => {
    setValue('chapter', '');
    setPreview(null);
    const book = books.find((b) => String(b.bookReferenceId) === bookReferenceId);
    if (!book) {
      setChapters([]);
      return;
    }
    void listChapters(book.id).then(setChapters, (e: unknown) => setError(describeError(e)));
  }, [bookReferenceId, books, setValue]);

  const submit = handleSubmit(async (values) => {
    setError(null);
    setPreview(null);
    const reference: PassageReference = {
      translationId: values.translationId,
      bookReferenceId: Number(values.bookReferenceId),
      chapter: Number(values.chapter),
      verseStart: Number(values.verseStart),
      verseEnd: Number(values.verseEnd),
    };
    try {
      setPreview(await getPassage(reference));
    } catch (e) {
      setError(describeError(e));
    }
  });

  const booksByTestament = books.reduce<Record<number, Book[]>>((groups, book) => {
    (groups[book.testamentReferenceId] ??= []).push(book);
    return groups;
  }, {});

  return (
    <div className="card">
      <h2>Selecionar passagem</h2>
      <form
        className="selector"
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <label>
          Tradução
          <select {...register('translationId')}>
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
          <select {...register('bookReferenceId')} disabled={books.length === 0}>
            <option value="">Escolha…</option>
            {Object.entries(booksByTestament).map(([testament, group]) => (
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
          <select {...register('chapter')} disabled={chapters.length === 0}>
            <option value="">Escolha…</option>
            {chapters.map((c) => (
              <option key={c.chapter} value={c.chapter}>
                Capítulo {c.chapter} ({c.verseCount} v.)
              </option>
            ))}
          </select>
        </label>

        <div className="range">
          <label>
            Versículo inicial
            <input type="number" min={1} {...register('verseStart')} />
          </label>
          <label>
            Versículo final
            <input type="number" min={1} {...register('verseEnd')} />
            {errors.verseEnd && (
              <span className="field-error">O versículo final deve ser ≥ o inicial.</span>
            )}
          </label>
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Carregando…' : 'Pré-visualizar'}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}

      {preview && (
        <article className="preview">
          <h3>{preview.label}</h3>
          <p className="passage-text">
            {preview.verses.map((v) => (
              <span key={v.verse}>
                <sup>{v.verse}</sup> {v.text}{' '}
              </span>
            ))}
          </p>
        </article>
      )}
    </div>
  );
}
