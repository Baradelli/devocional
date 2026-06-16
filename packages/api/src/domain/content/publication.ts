import type { LogicalDate } from '../gamification/logicalDate.js';

/**
 * Um devocional fica disponível às 00h da sua data. Como ambas são datas de
 * calendário (YYYY-MM-DD), a comparação lexicográfica equivale à cronológica.
 */
export function isDevotionalDue(devotionalDate: LogicalDate, today: LogicalDate): boolean {
  return devotionalDate <= today;
}
