import { describe, expect, it } from 'vitest';

import { addDays, lastNDates } from './dateWindow.js';

describe('dateWindow', () => {
  it('adds and subtracts days across month and year boundaries', () => {
    expect(addDays('2026-01-15', 1)).toBe('2026-01-16');
    expect(addDays('2026-01-15', -1)).toBe('2026-01-14');
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29'); // ano bissexto
  });

  it('lists the last N dates ending at today, chronological', () => {
    expect(lastNDates('2026-01-15', 1)).toEqual(['2026-01-15']);
    expect(lastNDates('2026-01-15', 3)).toEqual(['2026-01-13', '2026-01-14', '2026-01-15']);
  });
});
