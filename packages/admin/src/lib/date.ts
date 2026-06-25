/** Utilidades de data trabalhando em horário local (admin = um fuso, o do Vitor). */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

/** Quebra "YYYY-MM-DD" em ano/mês(1-12)/dia. */
export function parseISO(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number);
  return { year: year!, month: month!, day: day! };
}

export interface DayCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

/** Matriz de 6 semanas x 7 dias cobrindo o mês (semana começa no domingo). */
export function monthMatrix(year: number, month: number): DayCell[][] {
  const first = new Date(year, month - 1, 1);
  const gridStart = new Date(year, month - 1, 1 - first.getDay());
  const weeks: DayCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + w * 7 + d,
      );
      week.push({ iso: toISO(cur), day: cur.getDate(), inMonth: cur.getMonth() === month - 1 });
    }
    weeks.push(week);
  }
  return weeks;
}

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function monthLabel(year: number, month: number): string {
  return `${MONTHS[month - 1]} de ${year}`;
}

/** "18 de junho" (ou com ano se `withYear`). */
export function formatLong(iso: string, withYear = false): string {
  const { year, month, day } = parseISO(iso);
  const base = `${day} de ${MONTHS[month - 1]}`;
  return withYear ? `${base} de ${year}` : base;
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function weekdayShort(iso: string): string {
  const { year, month, day } = parseISO(iso);
  return WEEKDAYS[new Date(year, month - 1, day).getDay()]!;
}

export const WEEKDAY_HEADERS = WEEKDAYS;

export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const base = new Date(year, month - 1 + delta, 1);
  return { year: base.getFullYear(), month: base.getMonth() + 1 };
}
