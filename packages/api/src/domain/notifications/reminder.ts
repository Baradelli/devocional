/**
 * Regras puras do lembrete diário. A autoridade do horário é do servidor: o
 * disparo é decidido no fuso de cada usuário (ADR-002), sem ler o relógio aqui.
 */

/** Converte "HH:MM" em minutos desde a meia-noite. */
export function parseLocalTime(value: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    throw new Error(`Horário inválido: ${value}`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Minutos desde a meia-noite no fuso dado, para o instante dado (puro via Intl). */
export function localTimeMinutes(instant: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(instant);
  const hour = parts.find((p) => p.type === 'hour')?.value;
  const minute = parts.find((p) => p.type === 'minute')?.value;
  if (hour === undefined || minute === undefined) {
    throw new Error(`Não foi possível resolver o horário local para o fuso ${timeZone}.`);
  }
  const normalizedHour = Number(hour) % 24; // h23 pode emitir 24 na virada em alguns runtimes
  return normalizedHour * 60 + Number(minute);
}

export interface ReminderDueInput {
  /** Horário escolhido pelo usuário, em minutos desde a meia-noite. */
  reminderMinute: number;
  /** Há ao menos um canal ativo (push e/ou WhatsApp). */
  hasActiveChannel: boolean;
  /** Horário local atual do usuário, em minutos desde a meia-noite. */
  nowMinute: number;
  /** Último dia lógico em que o lembrete foi enviado (dedup diário). */
  lastSentLogicalDate: string | null;
  /** Dia lógico atual no fuso do usuário. */
  todayLogicalDate: string;
}

/**
 * Decide se o lembrete diário deve ser enviado agora. Dispara uma vez por dia,
 * quando o horário local já chegou — resiliente a ticks desalinhados e a
 * downtime (se o servidor subir tarde, ainda envia no mesmo dia).
 */
export function isReminderDue(input: ReminderDueInput): boolean {
  if (!input.hasActiveChannel) {
    return false;
  }
  if (input.lastSentLogicalDate === input.todayLogicalDate) {
    return false;
  }
  return input.nowMinute >= input.reminderMinute;
}
