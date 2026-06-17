import { shouldApplyNoteOperation } from '../../domain/notes/reconcile.js';
import { NoteError } from './errors.js';
import type { NoteRecord, NoteUnitOfWork } from './ports.js';

export interface NoteDeps {
  uow: NoteUnitOfWork;
}

export interface ApplyNoteOperationInput {
  userId: string;
  devotionalId: string;
  text: string;
  deleted: boolean;
  editedAt: Date;
  idempotencyKey: string;
}

/**
 * Aplica uma operação de anotação (escrita ou remoção). Reconcilia por
 * last-write-wins (domínio puro): reenvio idempotente e edição stale não mudam
 * nada. Numa transação para a leitura+upsert serem consistentes.
 */
export async function applyNoteOperation(
  deps: NoteDeps,
  input: ApplyNoteOperationInput,
): Promise<NoteRecord> {
  return deps.uow.run(async (repo) => {
    const date = await repo.findDevotionalDate(input.devotionalId);
    if (!date) {
      throw new NoteError('DEVOTIONAL_NOT_FOUND');
    }

    const current = await repo.findByUserAndDevotional(input.userId, input.devotionalId);
    if (!shouldApplyNoteOperation(current, input)) {
      return current!;
    }

    return repo.upsert({
      userId: input.userId,
      devotionalId: input.devotionalId,
      text: input.text,
      deleted: input.deleted,
      editedAt: input.editedAt,
      idempotencyKey: input.idempotencyKey,
    });
  });
}
