import type { NoteOperation } from '@devocional/shared';

import type { QueueStorage } from './queue.js';

/** Item enfileirado: uma operação de anotação pendente de sincronização. */
export type QueuedNoteOperation = NoteOperation;

export interface NoteQueue {
  list(): QueuedNoteOperation[];
  enqueue(operation: QueuedNoteOperation): void;
  /**
   * Mantém no máximo uma operação pendente por devocional, substituindo a
   * anterior no lugar. Usado pelo autosave: cada edição traz `idempotencyKey` e
   * `editedAt` novos, então o servidor aplica por last-write-wins sem duplicar.
   */
  upsertByDevotional(operation: QueuedNoteOperation): void;
  remove(idempotencyKeys: string[]): void;
  clear(): void;
}

/**
 * Fila local de operações de anotação. Cada edição/remoção tem `idempotencyKey`
 * própria; o servidor reconcilia por last-write-wins (`editedAt`) sem duplicar
 * — ver regra de domínio das anotações (M6).
 */
export function createNoteQueue(storage: QueueStorage): NoteQueue {
  function load(): QueuedNoteOperation[] {
    const raw = storage.read();
    if (!raw) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as QueuedNoteOperation[]) : [];
    } catch {
      return [];
    }
  }

  function save(items: QueuedNoteOperation[]): void {
    storage.write(JSON.stringify(items));
  }

  return {
    list: () => load(),
    enqueue(operation) {
      const items = load();
      if (items.some((item) => item.idempotencyKey === operation.idempotencyKey)) {
        return;
      }
      items.push(operation);
      save(items);
    },
    upsertByDevotional(operation) {
      const items = load();
      const index = items.findIndex((item) => item.devotionalId === operation.devotionalId);
      if (index >= 0) {
        items[index] = operation;
      } else {
        items.push(operation);
      }
      save(items);
    },
    remove(idempotencyKeys) {
      const keys = new Set(idempotencyKeys);
      save(load().filter((item) => !keys.has(item.idempotencyKey)));
    },
    clear() {
      save([]);
    },
  };
}

export function localStorageNoteQueue(key = 'devocional.noteQueue'): NoteQueue {
  return createNoteQueue({
    read: () => localStorage.getItem(key),
    write: (value) => localStorage.setItem(key, value),
  });
}
