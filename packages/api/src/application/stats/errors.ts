export type StatsErrorCode = 'RULER_TRANSLATION_NOT_FOUND';

export class StatsError extends Error {
  constructor(public readonly code: StatsErrorCode) {
    super(code);
    this.name = 'StatsError';
  }
}
