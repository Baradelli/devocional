import { useEffect, useRef, useState } from 'react';

import { ApiError } from '../api/client.js';
import { fetchNote } from '../api/notes.js';
import { localStorageNoteQueue } from '../offline/noteQueue.js';
import { flushNoteQueue } from '../offline/noteSync.js';

interface NoteEditorScreenProps {
  devotionalId: string;
  dateLabel: string;
  onClose: () => void;
}

type ExecCommand = 'bold' | 'italic' | 'h2' | 'h3' | 'quote' | 'list' | 'highlight';

/** Alterna <mark> sobre a seleção atual (destaque). */
function toggleHighlight(): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
    return;
  }
  const range = sel.getRangeAt(0);
  const existing = (range.commonAncestorContainer.parentElement ?? null)?.closest('mark');
  if (existing?.parentNode) {
    const parent = existing.parentNode;
    while (existing.firstChild) {
      parent.insertBefore(existing.firstChild, existing);
    }
    parent.removeChild(existing);
    return;
  }
  const mark = document.createElement('mark');
  try {
    range.surroundContents(mark);
  } catch {
    mark.appendChild(range.extractContents());
    range.insertNode(mark);
  }
  sel.removeAllRanges();
}

/**
 * Editor de anotação rich-text (estilo Notion/Obsidian) como overlay. Escrita
 * otimista e offline: salvar enfileira uma operação idempotente e sincroniza.
 * O corpo é HTML guardado no campo `text` da anotação.
 */
export function NoteEditorScreen({ devotionalId, dateLabel, onClose }: NoteEditorScreenProps) {
  const queue = useRef(localStorageNoteQueue()).current;
  const bodyRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<{ bold: boolean; italic: boolean }>({
    bold: false,
    italic: false,
  });

  useEffect(() => {
    void fetchNote(devotionalId).then(
      (note) => {
        if (bodyRef.current) {
          bodyRef.current.innerHTML = note.text;
        }
        setLoaded(true);
      },
      (error: unknown) => {
        if (!(error instanceof ApiError) || error.status === 404) {
          setLoaded(true);
        }
      },
    );
  }, [devotionalId]);

  useEffect(() => {
    const onSelection = () => {
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
      });
    };
    document.addEventListener('selectionchange', onSelection);
    return () => document.removeEventListener('selectionchange', onSelection);
  }, []);

  const exec = (cmd: ExecCommand) => {
    bodyRef.current?.focus();
    switch (cmd) {
      case 'bold':
        document.execCommand('bold');
        break;
      case 'italic':
        document.execCommand('italic');
        break;
      case 'h2':
        document.execCommand('formatBlock', false, 'h2');
        break;
      case 'h3':
        document.execCommand('formatBlock', false, 'h3');
        break;
      case 'quote':
        document.execCommand('formatBlock', false, 'blockquote');
        break;
      case 'list':
        document.execCommand('insertUnorderedList');
        break;
      case 'highlight':
        toggleHighlight();
        break;
    }
  };

  const save = () => {
    const text = bodyRef.current?.innerHTML ?? '';
    queue.enqueue({
      devotionalId,
      idempotencyKey: crypto.randomUUID(),
      editedAt: new Date().toISOString(),
      text,
      deleted: false,
    });
    void flushNoteQueue(queue).finally(onClose);
  };

  return (
    <section className="screen screen--overlay screen--note" aria-label="Anotação">
      <header className="screen__bar screen__bar--note">
        <button type="button" className="iconbtn" onClick={onClose} aria-label="Fechar sem salvar">
          ×
        </button>
        <span className="eyebrow">Anotação · {dateLabel}</span>
        <button type="button" className="note__save" onClick={save} disabled={!loaded}>
          Salvar
        </button>
      </header>
      <div className="note">
        <div className="note__toolbar" role="toolbar" aria-label="Formatação">
          <button type="button" onClick={() => exec('h2')} title="Título">
            H1
          </button>
          <button type="button" onClick={() => exec('h3')} title="Subtítulo">
            H2
          </button>
          <span className="note__sep" />
          <button
            type="button"
            className={active.bold ? 'is-active' : undefined}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('bold')}
            title="Negrito"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={active.italic ? 'is-active' : undefined}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('italic')}
            title="Itálico"
          >
            <em>i</em>
          </button>
          <button
            type="button"
            className="note__hl"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec('highlight')}
            title="Destaque"
          >
            A
          </button>
          <span className="note__sep" />
          <button type="button" onClick={() => exec('quote')} title="Citação">
            &ldquo;
          </button>
          <button type="button" onClick={() => exec('list')} title="Lista">
            •
          </button>
        </div>
        <div
          className="note__body"
          ref={bodyRef}
          contentEditable={loaded}
          suppressContentEditableWarning
          data-placeholder="Escreva o que tocou seu coração hoje…"
        />
      </div>
    </section>
  );
}
