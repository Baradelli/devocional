import type { NoteView } from '@devocional/shared';
import { useEffect, useRef, useState } from 'react';

import { fetchLibrary } from '../api/notes.js';
import { localStorageNoteQueue } from '../offline/noteQueue.js';
import { flushNoteQueue } from '../offline/noteSync.js';

type Status = 'loading' | 'ready' | 'error';

function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

/** Biblioteca pessoal: as próprias anotações por data (a única "viagem ao passado" do v1). */
export function Library() {
  const queue = useRef(localStorageNoteQueue()).current;
  const [notes, setNotes] = useState<NoteView[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    // Reconcilia pendências antes de listar, para refletir o estado local.
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
  }, [queue]);

  if (status === 'loading') {
    return <p className="muted center">Carregando suas anotações…</p>;
  }
  if (status === 'error') {
    return <p className="center">Não foi possível carregar agora. Tente novamente.</p>;
  }
  if (notes.length === 0) {
    return (
      <div className="center empty">
        <p>Você ainda não tem anotações.</p>
        <p className="muted">Suas reflexões do dia aparecem aqui.</p>
      </div>
    );
  }

  return (
    <ul className="library">
      {notes.map((note) => (
        <li key={note.devotionalId} className="library-item">
          <p className="library-date">{formatDate(note.date)}</p>
          <p className="library-text">{note.text}</p>
        </li>
      ))}
    </ul>
  );
}
