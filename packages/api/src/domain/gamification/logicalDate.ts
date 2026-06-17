/**
 * Dia lógico: a data de calendário (YYYY-MM-DD) no fuso do usuário no instante
 * dado. A autoridade do dia é do servidor (ADR-001) — o cliente envia o
 * timestamp da conclusão e o servidor recalcula contra o `timezone` do usuário.
 *
 * Função pura: recebe o instante e o fuso, sem ler o relógio do sistema.
 */
export type LogicalDate = string; // 'YYYY-MM-DD'

export function logicalDate(instant: Date, timeZone: string): LogicalDate {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(instant);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  if (!year || !month || !day) {
    throw new Error(`Não foi possível resolver o dia lógico para o fuso ${timeZone}.`);
  }
  return `${year}-${month}-${day}`;
}

function toUtcMillis(date: LogicalDate): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error(`LogicalDate inválida: ${date}`);
  }
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Diferença em dias inteiros de `from` até `to` (negativa se `to` é anterior). */
export function daysBetween(from: LogicalDate, to: LogicalDate): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((toUtcMillis(to) - toUtcMillis(from)) / MS_PER_DAY);
}
