export type BibleErrorCode = 'BOOK_NOT_FOUND' | 'PASSAGE_EMPTY';

export class BibleError extends Error {
  readonly code: BibleErrorCode;

  constructor(code: BibleErrorCode) {
    super(code);
    this.name = 'BibleError';
    this.code = code;
  }
}
