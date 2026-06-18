import { describe, expect, it } from 'vitest';

import { buildMonthGrid, buildWeek, formatDateline, formatMonthTitle, toIsoDate } from './dates.js';

describe('dates', () => {
  it('formats iso and dateline from local parts', () => {
    const d = new Date(2026, 5, 17); // 17 jun 2026 (quarta)
    expect(toIsoDate(d)).toBe('2026-06-17');
    expect(formatDateline(d)).toBe('Quarta · 17 jun');
    expect(formatMonthTitle('2026-06')).toBe('Junho 2026');
  });

  it('builds the week sun→sat with done/today/miss/future', () => {
    const today = new Date(2026, 5, 17); // quarta
    const week = buildWeek(today, ['2026-06-15', '2026-06-16']);
    expect(week).toHaveLength(7);
    expect(week[0]?.iso).toBe('2026-06-14'); // domingo
    expect(week.map((w) => w.status)).toEqual([
      'miss', // 14
      'done', // 15
      'done', // 16
      'today', // 17
      'future', // 18
      'future', // 19
      'future', // 20
    ]);
  });

  it('builds the month grid with leading blanks and statuses', () => {
    const today = new Date(2026, 5, 17);
    const grid = buildMonthGrid('2026-06', today, ['2026-06-03']);
    // 1º junho 2026 é segunda-feira → 1 célula em branco (domingo).
    expect(grid[0]).toEqual({ day: null, iso: null, status: null });
    expect(grid[1]).toMatchObject({ day: 1, iso: '2026-06-01' });
    expect(grid.find((c) => c.iso === '2026-06-03')?.status).toBe('done');
    expect(grid.find((c) => c.iso === '2026-06-17')?.status).toBe('today');
    expect(grid.filter((c) => c.day !== null)).toHaveLength(30);
  });
});
