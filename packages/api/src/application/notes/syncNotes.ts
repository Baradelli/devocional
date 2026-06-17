import { applyNoteOperation, type NoteDeps } from './applyNoteOperation.js';
import type { NoteRecord } from './ports.js';

export interface QueuedNoteOperation {
  devotionalId: string;
  text: string;
  deleted: boolean;
  editedAt: Date;
  idempotencyKey: string;
}

export interface SyncNotesInput {
  userId: string;
  operations: QueuedNoteOperation[];
}

/**
 * Reconcilia a fila offline de anotações. Aplica em ordem cronológica de edição
 * para o last-write-wins convergir; cada operação é idempotente. Devolve a
 * biblioteca resultante do usuário.
 */
export async function syncNotes(deps: NoteDeps, input: SyncNotesInput): Promise<NoteRecord[]> {
  const ordered = [...input.operations].sort((a, b) => a.editedAt.getTime() - b.editedAt.getTime());

  for (const op of ordered) {
    await applyNoteOperation(deps, { userId: input.userId, ...op });
  }

  return deps.uow.run((repo) => repo.listByUser(input.userId));
}
