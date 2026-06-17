export type NoteErrorCode = 'DEVOTIONAL_NOT_FOUND' | 'NOTE_NOT_FOUND';

export class NoteError extends Error {
  readonly code: NoteErrorCode;

  constructor(code: NoteErrorCode) {
    super(code);
    this.name = 'NoteError';
    this.code = code;
  }
}
