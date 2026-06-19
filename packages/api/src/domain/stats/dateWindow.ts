/**
 * Aritmética de dias sobre datas YYYY-MM-DD (dia lógico). Funções puras — sem
 * relógio do sistema. Usadas para as janelas de engajamento (7/30 dias).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function addDays(date: string, delta: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error(`Data inválida: ${date}`);
  }
  const base = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const shifted = new Date(base + delta * MS_PER_DAY);
  return `${String(shifted.getUTCFullYear())}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

/** As últimas `n` datas terminando em `today`, em ordem cronológica. */
export function lastNDates(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)));
}
