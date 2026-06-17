/**
 * Variáveis ajustáveis da gamificação (ver docs/design.md §6). Mantê-las em
 * config permite calibrar marcos sem mexer nas regras puras.
 */
export interface GamificationConfig {
  /** Insígnia semanal a cada N dias consecutivos (7, 14, 21…). */
  weeklyInterval: number;
  /** Prêmio mensal a cada N dias consecutivos (30, 60, 90…). */
  monthlyInterval: number;
}

export const DEFAULT_GAMIFICATION_CONFIG: GamificationConfig = {
  weeklyInterval: 7,
  monthlyInterval: 30,
};
