import { describe, expect, it } from 'vitest';

import { daysBetween, logicalDate } from './logicalDate.js';

describe('logicalDate', () => {
  it('keeps 23:59 local on the same logical day (São Paulo, UTC-3)', () => {
    // 02:59Z = 23:59 do dia 15 em São Paulo.
    expect(logicalDate(new Date('2026-06-16T02:59:00Z'), 'America/Sao_Paulo')).toBe('2026-06-15');
  });

  it('rolls to the next logical day at 00:01 local (São Paulo, UTC-3)', () => {
    // 03:01Z = 00:01 do dia 16 em São Paulo.
    expect(logicalDate(new Date('2026-06-16T03:01:00Z'), 'America/Sao_Paulo')).toBe('2026-06-16');
  });

  it('resolves the same instant to different days across timezones', () => {
    const instant = new Date('2026-06-16T05:00:00Z');
    expect(logicalDate(instant, 'America/Sao_Paulo')).toBe('2026-06-16'); // 02:00
    expect(logicalDate(instant, 'Pacific/Honolulu')).toBe('2026-06-15'); // 19:00 do dia 15
  });

  it('handles a far-east timezone crossing into the next day', () => {
    // 12:00Z + 14h = 02:00 do dia 17 em Kiritimati (UTC+14).
    expect(logicalDate(new Date('2026-06-16T12:00:00Z'), 'Pacific/Kiritimati')).toBe('2026-06-17');
  });
});

describe('daysBetween', () => {
  it('is 0 for the same day', () => {
    expect(daysBetween('2026-06-16', '2026-06-16')).toBe(0);
  });

  it('is 1 for consecutive days', () => {
    expect(daysBetween('2026-06-16', '2026-06-17')).toBe(1);
  });

  it('counts across a month boundary', () => {
    expect(daysBetween('2026-06-30', '2026-07-01')).toBe(1);
  });

  it('counts across a year boundary', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
  });

  it('is negative when the target is earlier', () => {
    expect(daysBetween('2026-06-17', '2026-06-16')).toBe(-1);
  });

  it('measures multi-day gaps', () => {
    expect(daysBetween('2026-06-10', '2026-06-16')).toBe(6);
  });
});
