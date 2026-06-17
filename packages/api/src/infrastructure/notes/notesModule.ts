import type { PrismaClient } from '@prisma/client';

import {
  applyNoteOperation,
  type ApplyNoteOperationInput,
} from '../../application/notes/applyNoteOperation.js';
import { NoteError } from '../../application/notes/errors.js';
import type { NoteRecord } from '../../application/notes/ports.js';
import { syncNotes, type SyncNotesInput } from '../../application/notes/syncNotes.js';
import { createNoteRepository, createNoteUnitOfWork } from './prismaNoteRepository.js';

export interface NotesModule {
  apply(input: ApplyNoteOperationInput): Promise<NoteRecord>;
  sync(input: SyncNotesInput): Promise<NoteRecord[]>;
  list(userId: string): Promise<NoteRecord[]>;
  get(userId: string, devotionalId: string): Promise<NoteRecord>;
}

export function createNotesModule(prisma: PrismaClient): NotesModule {
  const repo = createNoteRepository(prisma);
  const deps = { uow: createNoteUnitOfWork(prisma) };

  return {
    apply: (input) => applyNoteOperation(deps, input),
    sync: (input) => syncNotes(deps, input),
    list: (userId) => repo.listByUser(userId),
    get: async (userId, devotionalId) => {
      const note = await repo.findActiveByUserAndDevotional(userId, devotionalId);
      if (!note) {
        throw new NoteError('NOTE_NOT_FOUND');
      }
      return note;
    },
  };
}
