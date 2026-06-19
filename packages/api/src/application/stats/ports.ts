export interface RulerVerseKey {
  bookReferenceId: number;
  chapter: number;
  verse: number;
}

export interface RulerBook {
  bookReferenceId: number;
  name: string;
}

export interface PassageRef {
  bookReferenceId: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

/**
 * Porta de leitura para as estatísticas de cobertura. A régua é uma tradução
 * (ACF) resolvida por código; a cobertura é medida contra os versículos dela.
 */
export interface StatsRepository {
  findRulerTranslationId(code: string): Promise<string | null>;
  getRulerVerseKeys(translationId: string): Promise<RulerVerseKey[]>;
  getRulerBooks(translationId: string): Promise<RulerBook[]>;
  /** Toda referência de passagem de todos os devocionais (uma por bloco PASSAGE). */
  getPassageReferences(): Promise<PassageRef[]>;
  countDevotionals(): Promise<number>;
}
