import { describe, expect, it } from 'vitest';

import { isDevotionalDue } from './publication.js';

describe('isDevotionalDue', () => {
  it('is due when the devotional date is today', () => {
    expect(isDevotionalDue('2026-06-16', '2026-06-16')).toBe(true);
  });

  it('is due when the devotional date is in the past', () => {
    expect(isDevotionalDue('2026-06-10', '2026-06-16')).toBe(true);
  });

  it('is not due when the devotional date is in the future', () => {
    expect(isDevotionalDue('2026-06-17', '2026-06-16')).toBe(false);
  });

  it('compares correctly across month boundaries', () => {
    expect(isDevotionalDue('2026-06-30', '2026-07-01')).toBe(true);
    expect(isDevotionalDue('2026-07-01', '2026-06-30')).toBe(false);
  });
});
