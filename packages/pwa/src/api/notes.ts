import {
  type DeleteNoteInput,
  type NoteList,
  noteListSchema,
  noteOkSchema,
  type NoteView,
  noteViewSchema,
  type SaveNoteInput,
  type SyncNotesRequest,
} from '@devocional/shared';

import { apiRequest } from './client.js';

export function fetchLibrary(): Promise<NoteList> {
  return apiRequest('/notes', noteListSchema);
}

export function fetchNote(devotionalId: string): Promise<NoteView> {
  return apiRequest(`/notes/by-devotional/${devotionalId}`, noteViewSchema);
}

export function saveNote(input: SaveNoteInput): Promise<NoteView> {
  return apiRequest('/notes', noteViewSchema, { method: 'PUT', body: JSON.stringify(input) });
}

export function deleteNote(devotionalId: string, input: DeleteNoteInput): Promise<{ ok: boolean }> {
  return apiRequest(`/notes/by-devotional/${devotionalId}`, noteOkSchema, {
    method: 'DELETE',
    body: JSON.stringify(input),
  });
}

export function syncNotes(request: SyncNotesRequest): Promise<NoteList> {
  return apiRequest('/notes/sync', noteListSchema, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
