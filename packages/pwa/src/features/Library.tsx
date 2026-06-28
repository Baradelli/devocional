import type { NoteView } from '@devocional/shared';
import { useEffect, useRef, useState } from 'react';
import { LuArrowLeft, LuPencil } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';

import { ApiError } from '../api/client.js';
import { fetchToday } from '../api/devotional.js';
import { fetchLibrary } from '../api/notes.js';
import { SearchIcon } from '../components/icons.js';
import { DAY_ABBR, formatDayMonth, formatMonthTitle, parseIsoDate } from '../lib/dates.js';
import { summarize } from '../lib/notePreview.js';
import { localStorageNoteQueue } from '../offline/noteQueue.js';
import { flushNoteQueue } from '../offline/noteSync.js';

type Status = 'loading' | 'ready' | 'error';

interface TodayRef {
  id: string;
  label: string;
}

interface MonthGroup {
  key: string;
  notes: NoteView[];
}

function groupByMonth(notes: NoteView[]): MonthGroup[] {
  const sorted = [...notes].sort((a, b) => b.date.localeCompare(a.date));
  const groups: MonthGroup[] = [];
  for (const note of sorted) {
    const key = note.date.slice(0, 7);
    const group = groups.find((g) => g.key === key);
    if (group) {
      group.notes.push(note);
    } else {
      groups.push({ key, notes: [note] });
    }
  }
  return groups;
}

/** Biblioteca pessoal de anotações, por mês, com busca; o editor é uma rota. */
export function Library() {
  const navigate = useNavigate();
  const queue = useRef(localStorageNoteQueue()).current;
  const [notes, setNotes] = useState<NoteView[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [query, setQuery] = useState('');
  const [todayRef, setTodayRef] = useState<TodayRef | null>(null);

  const load = () => {
    void flushNoteQueue(queue)
      .catch(() => undefined)
      .then(() => fetchLibrary())
      .then(
        (library) => {
          setNotes(library.notes);
          setStatus('ready');
        },
        () => setStatus('error'),
      );
  };

  useEffect(() => {
    load();
    void fetchToday().then(
      (view) => setTodayRef({ id: view.id, label: formatDayMonth(parseIsoDate(view.date)) }),
      (error: unknown) => {
        if (error instanceof ApiError && error.status === 404) {
          setTodayRef(null);
        }
      },
    );
  }, []);

  const openEditor = (devotionalId: string, dateLabel: string) => {
    void navigate(`/notes/${devotionalId}/edit`, { state: { dateLabel } });
  };

  const filtered = query.trim()
    ? notes.filter((n) => summarize(n.text).preview.toLowerCase().includes(query.toLowerCase()))
    : notes;
  const groups = groupByMonth(filtered);

  return (
    <section className="screen screen--notespage">
      <header className="topbar">
        <button
          type="button"
          className="topbar__icon"
          onClick={() => void navigate('/today')}
          aria-label="Voltar para hoje"
        >
          <LuArrowLeft />
        </button>
        <span className="eyebrow">Minhas anotações</span>
        <span className="topbar__icon" aria-hidden="true" />
      </header>

      <div className="library">
        <label className="lib__search">
          <SearchIcon />
          <input
            type="search"
            placeholder="Buscar nas anotações…"
            aria-label="Buscar nas anotações"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        {todayRef && (
          <button
            type="button"
            className="lib__today"
            onClick={() => openEditor(todayRef.id, todayRef.label)}
          >
            <span className="lib__today__icon" aria-hidden="true">
              <LuPencil />
            </span>
            <span className="lib__today__txt">
              <b>Anotar sobre hoje</b>
              <span>{todayRef.label}</span>
            </span>
            <span className="lib__today__plus" aria-hidden="true">
              +
            </span>
          </button>
        )}

        {status === 'loading' && <p className="muted center">Carregando suas anotações…</p>}
        {status === 'error' && (
          <p className="center">Não foi possível carregar agora. Tente novamente.</p>
        )}
        {status === 'ready' && notes.length === 0 && (
          <div className="center empty">
            <p>Você ainda não tem anotações.</p>
            <p className="muted">Suas reflexões do dia aparecem aqui.</p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.key} className="lib__group">
            <p className="lib__month label">{formatMonthTitle(group.key)}</p>
            <ul className="lib__list">
              {group.notes.map((note) => {
                const date = parseIsoDate(note.date);
                const { title, preview } = summarize(note.text);
                return (
                  <li key={note.devotionalId}>
                    <button
                      type="button"
                      className="note-item"
                      onClick={() => openEditor(note.devotionalId, formatDayMonth(date))}
                    >
                      <span className="note-item__date">
                        <b>{date.getDate()}</b>
                        <span>{DAY_ABBR[date.getDay()]}</span>
                      </span>
                      <span className="note-item__body">
                        <span className="note-item__title">{title}</span>
                        <span className="note-item__preview">{preview}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
