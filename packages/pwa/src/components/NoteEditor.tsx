import { useEffect, useRef, useState } from 'react';

import { ApiError } from '../api/client.js';
import { fetchNote } from '../api/notes.js';
import { localStorageNoteQueue } from '../offline/noteQueue.js';
import { flushNoteQueue } from '../offline/noteSync.js';

type SaveState = 'idle' | 'saving' | 'saved' | 'offline';

interface NoteEditorProps {
  devotionalId: string;
}

/**
 * Anotação do dia: escrita otimista e offline-capable. Cada ação enfileira uma
 * operação com `idempotencyKey` e `editedAt`; o servidor reconcilia (M6/M2).
 */
export function NoteEditor({ devotionalId }: NoteEditorProps) {
  const queue = useRef(localStorageNoteQueue()).current;
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<SaveState>('idle');

  useEffect(() => {
    void fetchNote(devotionalId).then(
      (note) => {
        setText(note.text);
        setLoaded(true);
      },
      (error: unknown) => {
        // 404 = ainda não há anotação; qualquer outro erro deixa começar do zero.
        if (!(error instanceof ApiError) || error.status === 404) {
          setLoaded(true);
        }
      },
    );
  }, [devotionalId]);

  const persist = (nextText: string, deleted: boolean) => {
    queue.enqueue({
      devotionalId,
      idempotencyKey: crypto.randomUUID(),
      editedAt: new Date().toISOString(),
      text: nextText,
      deleted,
    });
    setState('saving');
    void flushNoteQueue(queue).then(
      () => setState('saved'),
      () => setState('offline'),
    );
  };

  const save = () => persist(text, false);
  const remove = () => {
    setText('');
    persist('', true);
  };

  return (
    <section className="note">
      <h2 className="note-title">Minha anotação</h2>
      <textarea
        className="note-input"
        placeholder="Escreva o que tocou seu coração hoje…"
        value={text}
        disabled={!loaded}
        onChange={(event) => {
          setText(event.target.value);
          setState('idle');
        }}
      />
      <div className="note-actions">
        <button type="button" className="finish-btn" onClick={save} disabled={!loaded}>
          Salvar anotação
        </button>
        {text.trim() === '' ? null : (
          <button type="button" className="link" onClick={remove}>
            Apagar
          </button>
        )}
      </div>
      {state === 'saved' && <p className="muted">Anotação salva.</p>}
      {state === 'offline' && (
        <p className="muted">Salvo. Sincroniza quando você estiver online.</p>
      )}
    </section>
  );
}
