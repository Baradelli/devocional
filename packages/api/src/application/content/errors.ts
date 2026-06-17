export type ContentErrorCode =
  | 'DEVOTIONAL_EXISTS'
  | 'DEVOTIONAL_NOT_FOUND'
  | 'PASSAGE_UNAVAILABLE'
  | 'MEDIA_NOT_FOUND';

export class ContentError extends Error {
  readonly code: ContentErrorCode;

  constructor(code: ContentErrorCode) {
    super(code);
    this.name = 'ContentError';
    this.code = code;
  }
}
