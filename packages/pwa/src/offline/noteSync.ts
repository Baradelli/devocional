import type { NoteList } from '@devocional/shared';

import { syncNotes } from '../api/notes.js';
import type { NoteQueue } from './noteQueue.js';

/**
 * Reconcilia a fila offline de anotações com o servidor. Em sucesso, remove os
 * itens sincronizados e devolve a biblioteca atualizada; em falha (offline),
 * mantém tudo para a próxima tentativa.
 */
export async function flushNoteQueue(queue: NoteQueue): Promise<NoteList | null> {
  const items = queue.list();
  if (items.length === 0) {
    return null;
  }
  const library = await syncNotes({ operations: items });
  queue.remove(items.map((item) => item.idempotencyKey));
  return library;
}
