import { describe, expect, it } from 'vitest';

import { CANON_BOOK_COUNT, SECTION_KEYS, sectionOf, testamentOf } from './canon.js';

describe('canon', () => {
  it('splits testaments at the Gospels (1–39 OLD, 40–66 NEW)', () => {
    expect(testamentOf(1)).toBe('OLD');
    expect(testamentOf(39)).toBe('OLD');
    expect(testamentOf(40)).toBe('NEW');
    expect(testamentOf(66)).toBe('NEW');
  });

  it('maps each book to its canonical section', () => {
    expect(sectionOf(1)).toBe('PENTATEUCH');
    expect(sectionOf(5)).toBe('PENTATEUCH');
    expect(sectionOf(6)).toBe('HISTORICAL');
    expect(sectionOf(17)).toBe('HISTORICAL');
    expect(sectionOf(18)).toBe('POETIC');
    expect(sectionOf(22)).toBe('POETIC');
    expect(sectionOf(23)).toBe('PROPHETS');
    expect(sectionOf(39)).toBe('PROPHETS');
    expect(sectionOf(40)).toBe('GOSPELS');
    expect(sectionOf(44)).toBe('GOSPELS');
    expect(sectionOf(45)).toBe('EPISTLES');
    expect(sectionOf(65)).toBe('EPISTLES');
    expect(sectionOf(66)).toBe('REVELATION');
  });

  it('rejects book ids outside the 66-book canon', () => {
    expect(() => sectionOf(0)).toThrow();
    expect(() => sectionOf(67)).toThrow();
    expect(() => testamentOf(67)).toThrow();
  });

  it('exposes the canon size and the seven sections in order', () => {
    expect(CANON_BOOK_COUNT).toBe(66);
    expect(SECTION_KEYS).toEqual([
      'PENTATEUCH',
      'HISTORICAL',
      'POETIC',
      'PROPHETS',
      'GOSPELS',
      'EPISTLES',
      'REVELATION',
    ]);
  });
});
