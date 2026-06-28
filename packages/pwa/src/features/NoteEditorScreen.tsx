import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuCheck, LuCloudOff, LuTrash2 } from 'react-icons/lu';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { ApiError } from '../api/client.js';
import { fetchNote } from '../api/notes.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import type { SaveStatus } from './note/autosaveController.js';
import { noteEditorExtensions } from './note/editorExtensions.js';
import { NoteBubbleMenu } from './note/NoteBubbleMenu.js';
import { NoteToolbar } from './note/NoteToolbar.js';
import { readNoteToolbarEnabled } from './note/noteToolbarPreference.js';
import { useNoteAutosave } from './note/useNoteAutosave.js';

const PLACEHOLDER = 'Escreva o que tocou seu coração hoje…';

// Estável entre renders: o useEditor v3 reconfigura (e entra em loop) se as
// options mudarem de referência a cada render.
const EDITOR_PROPS = { attributes: { 'aria-label': 'Corpo da anotação' } };

function readMarkdown(editor: Editor): string {
  const storage = (
    editor.storage as unknown as Record<string, { getMarkdown?: () => string } | undefined>
  ).markdown;
  return storage?.getMarkdown?.() ?? '';
}

function StatusChip({ status }: { status: SaveStatus }) {
  switch (status) {
    case 'saving':
      return <span className="note__status">Salvando…</span>;
    case 'saved':
      return (
        <span className="note__status">
          <LuCheck aria-hidden="true" /> Salvo
        </span>
      );
    case 'offline':
      return (
        <span className="note__status">
          <LuCloudOff aria-hidden="true" /> Salvo · offline
        </span>
      );
    case 'error':
      return <span className="note__status note__status--err">Erro ao salvar</span>;
    default:
      return <span className="note__status" aria-hidden="true" />;
  }
}

function NoteHeader({
  dateLabel,
  onClose,
  status,
  onDelete,
}: {
  dateLabel: string;
  onClose: () => void;
  status: SaveStatus;
  onDelete?: () => void;
}) {
  return (
    <header className="screen__bar screen__bar--note">
      <button type="button" className="iconbtn" onClick={onClose} aria-label="Fechar anotação">
        ×
      </button>
      <span className="eyebrow">Anotação · {dateLabel}</span>
      <div className="note__bar-right">
        <StatusChip status={status} />
        {onDelete && (
          <button
            type="button"
            className="iconbtn note__delete"
            onClick={onDelete}
            aria-label="Excluir anotação"
          >
            <LuTrash2 />
          </button>
        )}
      </div>
    </header>
  );
}

function NoteEditor({
  devotionalId,
  dateLabel,
  existed,
  initialMarkdown,
  onClose,
}: {
  devotionalId: string;
  dateLabel: string;
  existed: boolean;
  initialMarkdown: string;
  onClose: () => void;
}) {
  // Nota nova abre já titulada com a data e é criada na hora (aparece na
  // biblioteca, fica claro que criou); a existente carrega o próprio conteúdo.
  const isNew = !existed && initialMarkdown.trim() === '';
  const seededContent = isNew ? `# ${dateLabel}\n\n` : initialMarkdown;
  const baseline = isNew ? '' : initialMarkdown;
  const { status, notifyChange, removeNote } = useNoteAutosave(devotionalId, existed, baseline);
  const [confirming, setConfirming] = useState(false);
  // Lida uma vez: a preferência só muda nas Configurações (rota separada).
  const showToolbar = useMemo(() => readNoteToolbarEnabled(), []);
  const extensions = useMemo(() => noteEditorExtensions(PLACEHOLDER), []);
  const editor = useEditor({
    extensions,
    content: seededContent,
    autofocus: isNew ? 'end' : false,
    editorProps: EDITOR_PROPS,
    onCreate: ({ editor }) => {
      if (isNew) {
        notifyChange(readMarkdown(editor));
      }
    },
    onUpdate: ({ editor }) => notifyChange(readMarkdown(editor)),
  });

  const confirmDelete = () => {
    removeNote();
    onClose();
  };

  return (
    <section className="screen screen--overlay screen--note" aria-label="Anotação">
      <div className="note-topbar">
        <NoteHeader
          dateLabel={dateLabel}
          onClose={onClose}
          status={status}
          onDelete={() => setConfirming(true)}
        />
        {showToolbar && editor && <NoteToolbar editor={editor} />}
      </div>
      <div className="note">
        {editor && <NoteBubbleMenu editor={editor} />}
        <EditorContent editor={editor} className="note__body" />
      </div>
      {confirming && (
        <ConfirmModal
          title="Excluir esta anotação?"
          message="Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </section>
  );
}

type LoadState =
  | { phase: 'loading' }
  | { phase: 'ready'; existed: boolean; markdown: string }
  | { phase: 'error' };

/**
 * Editor de anotação (estilo Notion/Obsidian) como overlay. O conteúdo é
 * Markdown guardado no campo `text`; o autosave enfileira operações idempotentes
 * e sincroniza. Erro de rede ao abrir NÃO vira nota vazia (evita sobrescrever).
 */
export function NoteEditorScreen() {
  const { id: devotionalId = '' } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const dateLabel = (location.state as { dateLabel?: string } | null)?.dateLabel ?? 'Anotação';
  const close = useCallback(() => void navigate(-1), [navigate]);
  const [state, setState] = useState<LoadState>({ phase: 'loading' });

  const load = useCallback(() => {
    setState({ phase: 'loading' });
    void fetchNote(devotionalId).then(
      (note) => setState({ phase: 'ready', existed: true, markdown: note.text }),
      (error: unknown) => {
        if (error instanceof ApiError && error.status === 404) {
          setState({ phase: 'ready', existed: false, markdown: '' });
        } else {
          setState({ phase: 'error' });
        }
      },
    );
  }, [devotionalId]);

  useEffect(load, [load]);

  if (state.phase === 'ready') {
    return (
      <NoteEditor
        devotionalId={devotionalId}
        dateLabel={dateLabel}
        existed={state.existed}
        initialMarkdown={state.markdown}
        onClose={close}
      />
    );
  }

  return (
    <section className="screen screen--overlay screen--note" aria-label="Anotação">
      <NoteHeader dateLabel={dateLabel} onClose={close} status="idle" />
      <div className="note">
        {state.phase === 'loading' ? (
          <p className="muted center">Carregando sua anotação…</p>
        ) : (
          <div className="center empty">
            <p>Não foi possível abrir agora.</p>
            <button type="button" className="btn btn--ghost" onClick={load}>
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
