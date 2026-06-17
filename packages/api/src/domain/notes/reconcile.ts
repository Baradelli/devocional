export interface NoteSnapshot {
  editedAt: Date;
  idempotencyKey: string;
}

export interface NoteOperationInput {
  editedAt: Date;
  idempotencyKey: string;
}

/**
 * Decide se uma operação de anotação deve ser aplicada. Reconciliação da fila
 * offline: last-write-wins por `editedAt`; reenvio da mesma `idempotencyKey` ou
 * de uma edição não mais recente é ignorado (idempotente). Pura, sem I/O.
 */
export function shouldApplyNoteOperation(
  current: NoteSnapshot | null,
  op: NoteOperationInput,
): boolean {
  if (!current) {
    return true;
  }
  if (op.idempotencyKey === current.idempotencyKey) {
    return false;
  }
  return op.editedAt.getTime() > current.editedAt.getTime();
}
