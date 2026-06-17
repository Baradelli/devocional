export interface NoteRecord {
  devotionalId: string;
  date: string; // data do devocional (YYYY-MM-DD)
  text: string;
  deleted: boolean;
  editedAt: Date;
  idempotencyKey: string;
  updatedAt: Date;
}

export interface NoteUpsertInput {
  userId: string;
  devotionalId: string;
  text: string;
  deleted: boolean;
  editedAt: Date;
  idempotencyKey: string;
}

export interface NoteRepository {
  /** Data do devocional, ou `null` se ele não existe. */
  findDevotionalDate(devotionalId: string): Promise<string | null>;
  /** Anotação atual (incluindo soft-deletada) — base da reconciliação. */
  findByUserAndDevotional(userId: string, devotionalId: string): Promise<NoteRecord | null>;
  upsert(input: NoteUpsertInput): Promise<NoteRecord>;
  /** Biblioteca pessoal: anotações ativas do usuário, por data (desc). */
  listByUser(userId: string): Promise<NoteRecord[]>;
  /** Anotação ativa de um dia, ou `null` se ausente/removida. */
  findActiveByUserAndDevotional(userId: string, devotionalId: string): Promise<NoteRecord | null>;
}

export interface NoteUnitOfWork {
  run<T>(work: (repo: NoteRepository) => Promise<T>): Promise<T>;
}
