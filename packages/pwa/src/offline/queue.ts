import type { CompletionInput } from '@devocional/shared';

/** Item enfileirado: uma conclusão pendente de sincronização. */
export type QueuedCompletion = Pick<CompletionInput, 'idempotencyKey' | 'completedAt'>;

/** Abstração de armazenamento (localStorage em produção; fake nos testes). */
export interface QueueStorage {
  read(): string | null;
  write(value: string): void;
}

export interface CompletionQueue {
  list(): QueuedCompletion[];
  enqueue(completion: QueuedCompletion): void;
  remove(idempotencyKeys: string[]): void;
  clear(): void;
}

/**
 * Fila local de conclusões offline. Dedup por `idempotencyKey` (a autoridade do
 * streak é do servidor; reenviar a mesma chave nunca duplica — ver M2/ADR-001).
 */
export function createCompletionQueue(storage: QueueStorage): CompletionQueue {
  function load(): QueuedCompletion[] {
    const raw = storage.read();
    if (!raw) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as QueuedCompletion[]) : [];
    } catch {
      return [];
    }
  }

  function save(items: QueuedCompletion[]): void {
    storage.write(JSON.stringify(items));
  }

  return {
    list: () => load(),
    enqueue(completion) {
      const items = load();
      if (items.some((item) => item.idempotencyKey === completion.idempotencyKey)) {
        return;
      }
      items.push(completion);
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

export function localStorageQueue(key = 'devocional.completionQueue'): CompletionQueue {
  return createCompletionQueue({
    read: () => localStorage.getItem(key),
    write: (value) => localStorage.setItem(key, value),
  });
}
