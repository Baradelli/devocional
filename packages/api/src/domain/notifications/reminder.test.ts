import { describe, expect, it } from 'vitest';

import { isReminderDue, localTimeMinutes, parseLocalTime } from './reminder.js';

describe('parseLocalTime', () => {
  it('parses HH:MM into minutes since midnight', () => {
    expect(parseLocalTime('00:00')).toBe(0);
    expect(parseLocalTime('07:30')).toBe(450);
    expect(parseLocalTime('23:59')).toBe(1439);
  });

  it('rejects malformed times', () => {
    expect(() => parseLocalTime('7:30')).toThrow();
    expect(() => parseLocalTime('24:00')).toThrow();
    expect(() => parseLocalTime('12:60')).toThrow();
  });
});

describe('localTimeMinutes', () => {
  it('resolves the local time in the user timezone', () => {
    // 2026-06-17T12:00:00Z = 09:00 em São Paulo (UTC-3).
    const instant = new Date('2026-06-17T12:00:00Z');
    expect(localTimeMinutes(instant, 'America/Sao_Paulo')).toBe(9 * 60);
    expect(localTimeMinutes(instant, 'UTC')).toBe(12 * 60);
  });
});

describe('isReminderDue', () => {
  const base = {
    reminderMinute: 7 * 60,
    hasActiveChannel: true,
    nowMinute: 7 * 60,
    lastSentLogicalDate: null,
    todayLogicalDate: '2026-06-17',
  };

  it('is due once the local time has arrived', () => {
    expect(isReminderDue(base)).toBe(true);
    expect(isReminderDue({ ...base, nowMinute: 9 * 60 })).toBe(true);
  });

  it('is not due before the chosen time', () => {
    expect(isReminderDue({ ...base, nowMinute: 6 * 60 + 59 })).toBe(false);
  });

  it('is not due when no channel is active', () => {
    expect(isReminderDue({ ...base, hasActiveChannel: false })).toBe(false);
  });

  it('does not fire twice on the same logical day', () => {
    expect(isReminderDue({ ...base, lastSentLogicalDate: '2026-06-17' })).toBe(false);
  });

  it('fires again on a new day', () => {
    expect(
      isReminderDue({ ...base, lastSentLogicalDate: '2026-06-16', todayLogicalDate: '2026-06-17' }),
    ).toBe(true);
  });
});
