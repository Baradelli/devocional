import { isBlank } from '../../lib/notePreview.js';
import type { NoteQueue } from '../../offline/noteQueue.js';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

export interface AutosaveDeps {
  devotionalId: string;
  /** Se já existia um registro no servidor ao abrir (define soft-delete ao esvaziar). */
  existedOnLoad: boolean;
  /** Conteúdo carregado, para não re-salvar no primeiro update do editor. */
  initialMarkdown: string;
  queue: NoteQueue;
  flush: (queue: NoteQueue) => Promise<unknown>;
  now: () => string;
  newId: () => string;
  onStatus: (status: SaveStatus) => void;
  debounceMs?: number;
  maxWaitMs?: number;
}

export interface AutosaveController {
  /** Chamar a cada update do editor com o markdown atual. */
  change(markdown: string): void;
  /** Persistir o pendente já (blur, troca de rota, app em background). */
  flushNow(): void;
  /** Excluir (soft-delete) a anotação e travar saves posteriores. */
  remove(): void;
  /** Cancelar timers pendentes sem persistir. */
  dispose(): void;
}

/**
 * Autosave coalescido sobre a fila offline idempotente: debounce + max-wait,
 * uma operação por devocional, last-write-wins. Puro (timers e deps injetados)
 * para ser testável sem DOM; o wiring de eventos vive em `useNoteAutosave`.
 */
export function createAutosaveController(deps: AutosaveDeps): AutosaveController {
  const debounceMs = deps.debounceMs ?? 1000;
  const maxWaitMs = deps.maxWaitMs ?? 5000;

  let committed = deps.initialMarkdown;
  let pending = deps.initialMarkdown;
  let existed = deps.existedOnLoad;
  let resting: SaveStatus = 'idle';
  let closed = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | null = null;

  const clearDebounce = () => {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };
  const clearMax = () => {
    if (maxTimer !== null) {
      clearTimeout(maxTimer);
      maxTimer = null;
    }
  };

  function commit(): void {
    clearDebounce();
    clearMax();
    if (closed || pending === committed) {
      return;
    }
    const blank = isBlank(pending);
    committed = pending;
    if (blank && !existed) {
      resting = 'idle';
      deps.onStatus('idle');
      return;
    }
    deps.queue.upsertByDevotional({
      devotionalId: deps.devotionalId,
      idempotencyKey: deps.newId(),
      editedAt: deps.now(),
      text: blank ? '' : pending,
      deleted: blank,
    });
    existed = !blank;
    resting = 'saved';
    deps.onStatus('saved');
    void deps
      .flush(deps.queue)
      .then(() => {
        resting = 'saved';
        deps.onStatus('saved');
      })
      .catch(() => {
        resting = 'offline';
        deps.onStatus('offline');
      });
  }

  return {
    change(markdown) {
      if (closed) {
        return;
      }
      pending = markdown;
      if (markdown === committed) {
        clearDebounce();
        clearMax();
        deps.onStatus(resting);
        return;
      }
      deps.onStatus('saving');
      clearDebounce();
      debounceTimer = setTimeout(commit, debounceMs);
      if (maxTimer === null) {
        maxTimer = setTimeout(commit, maxWaitMs);
      }
    },
    flushNow() {
      if (!closed) {
        commit();
      }
    },
    remove() {
      clearDebounce();
      clearMax();
      closed = true;
      if (!existed && isBlank(committed)) {
        // Nunca foi salva: não há nada a excluir.
        deps.onStatus('idle');
        return;
      }
      deps.queue.upsertByDevotional({
        devotionalId: deps.devotionalId,
        idempotencyKey: deps.newId(),
        editedAt: deps.now(),
        text: '',
        deleted: true,
      });
      deps.onStatus('saved');
      void deps
        .flush(deps.queue)
        .then(() => deps.onStatus('saved'))
        .catch(() => deps.onStatus('offline'));
    },
    dispose() {
      clearDebounce();
      clearMax();
    },
  };
}
