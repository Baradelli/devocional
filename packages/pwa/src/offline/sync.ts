import type { ProgressSnapshot } from '@devocional/shared';

import { syncCompletions } from '../api/progress.js';
import type { CompletionQueue } from './queue.js';

/**
 * Reconcilia a fila offline com o servidor. Em sucesso, remove os itens
 * sincronizados; em falha (offline), mantém tudo para a próxima tentativa.
 */
export async function flushQueue(queue: CompletionQueue): Promise<ProgressSnapshot | null> {
  const items = queue.list();
  if (items.length === 0) {
    return null;
  }
  const snapshot = await syncCompletions({
    completions: items.map((item) => ({
      idempotencyKey: item.idempotencyKey,
      completedAt: item.completedAt,
    })),
  });
  queue.remove(items.map((item) => item.idempotencyKey));
  return snapshot;
}
