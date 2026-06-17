import type { NoteList, NoteView } from '@devocional/shared';

import type { NoteRecord } from '../../application/notes/ports.js';

export function toNoteView(note: NoteRecord): NoteView {
  return {
    devotionalId: note.devotionalId,
    date: note.date,
    text: note.text,
    editedAt: note.editedAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export function toNoteList(notes: NoteRecord[]): NoteList {
  return { notes: notes.map(toNoteView) };
}
