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

/** Uma conclusão por (usuário, dia lógico) — já único no banco. */
export interface CompletionDay {
  userId: string;
  logicalDate: string;
}

export interface StreakRow {
  currentStreak: number;
  longestStreak: number;
}

export interface MostCompletedRow {
  devotionalId: string;
  date: string;
  theme: string | null;
  completions: number;
}

/** Linha do roster: usuário (MEMBER) + sinais leves de hábito (ADR-009). */
export interface RosterUserRow {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  onboardingCompletedAt: Date | null;
  timezone: string;
  currentStreak: number;
  /** Maior dia lógico concluído (YYYY-MM-DD) ou null. */
  lastCompletedDate: string | null;
  totalCompletions: number;
}

/**
 * Porta de leitura das estatísticas. Cobertura (Grupo A) mede contra a régua
 * (ACF); engajamento (Grupo B) agrega conclusões/streaks — sempre agregado.
 */
export interface StatsRepository {
  findRulerTranslationId(code: string): Promise<string | null>;
  getRulerVerseKeys(translationId: string): Promise<RulerVerseKey[]>;
  getRulerBooks(translationId: string): Promise<RulerBook[]>;
  /** Toda referência de passagem de todos os devocionais (uma por bloco PASSAGE). */
  getPassageReferences(): Promise<PassageRef[]>;
  countDevotionals(): Promise<number>;

  countUsers(): Promise<number>;
  /** Conclusões (userId + dia lógico) a partir de `sinceDate` (inclusive). */
  getCompletionDaysSince(sinceDate: string): Promise<CompletionDay[]>;
  getStreakRows(): Promise<StreakRow[]>;
  /** Devocionais mais concluídos; ignora conclusões sem `devotionalId`. */
  getMostCompletedDevotionals(limit: number): Promise<MostCompletedRow[]>;

  /** Membros (não-admin) com agregados de hábito, ordenados por nome. */
  getRosterUsers(): Promise<RosterUserRow[]>;
}
