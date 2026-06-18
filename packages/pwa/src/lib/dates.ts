/**
 * Helpers de data para a faixa da semana e o calendário de sequência.
 * Trabalham com a data local do device (≈ fuso do usuário) para exibição; a
 * autoridade do dia lógico/streak continua sendo do servidor.
 */

export const WEEKDAY_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTH_ABBR = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

const WEEKDAY_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const DAY_ABBR = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const pad = (n: number): string => String(n).padStart(2, '0');

/** Date local a partir de YYYY-MM-DD (sem deslocamento de fuso). */
export function parseIsoDate(iso: string): Date {
  const parts = iso.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

/** YYYY-MM-DD a partir das partes locais de uma Date. */
export function toIsoDate(date: Date): string {
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** YYYY-MM de uma Date (local). */
export function toMonthKey(date: Date): string {
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}`;
}

/** Linha "Quarta · 17 jun". */
export function formatDateline(date: Date): string {
  return `${WEEKDAY_LONG[date.getDay()] ?? ''} · ${String(date.getDate())} ${MONTH_ABBR[date.getMonth()] ?? ''}`;
}

/** "Junho 2026" a partir de YYYY-MM. */
export function formatMonthTitle(monthKey: string): string {
  const parts = monthKey.split('-');
  const month = Number(parts[1]);
  return `${MONTH_NAMES[month - 1] ?? ''} ${parts[0] ?? ''}`;
}

/** "12 mai" a partir de uma Date. */
export function formatDayMonth(date: Date): string {
  return `${String(date.getDate())} ${MONTH_ABBR[date.getMonth()] ?? ''}`;
}

export type DayStatus = 'done' | 'today' | 'miss' | 'future';

export interface WeekDay {
  /** Número do dia no mês, ou null para fora do mês corrente (raro na semana). */
  day: number;
  dow: string;
  iso: string;
  status: DayStatus;
}

function statusFor(iso: string, todayIso: string, completed: Set<string>): DayStatus {
  if (completed.has(iso)) {
    return 'done';
  }
  if (iso === todayIso) {
    return 'today';
  }
  return iso < todayIso ? 'miss' : 'future';
}

/** Os 7 dias da semana (domingo→sábado) que contêm `today`. */
export function buildWeek(today: Date, completedDates: string[]): WeekDay[] {
  const completed = new Set(completedDates);
  const todayIso = toIsoDate(today);
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const iso = toIsoDate(d);
    return {
      day: d.getDate(),
      dow: WEEKDAY_SHORT[i] ?? '',
      iso,
      status: statusFor(iso, todayIso, completed),
    };
  });
}

export interface CalendarCell {
  day: number | null;
  iso: string | null;
  status: DayStatus | null;
}

/**
 * Grade do mês YYYY-MM: células em branco até o 1º dia cair na coluna certa
 * (domingo=0), seguidas dos dias do mês com seu status.
 */
export function buildMonthGrid(
  monthKey: string,
  today: Date,
  completedDates: string[],
): CalendarCell[] {
  const parts = monthKey.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const completed = new Set(completedDates);
  const todayIso = toIsoDate(today);
  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push({ day: null, iso: null, status: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${String(year)}-${pad(month)}-${pad(d)}`;
    cells.push({ day: d, iso, status: statusFor(iso, todayIso, completed) });
  }
  return cells;
}
