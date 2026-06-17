import { describe, expect, it } from 'vitest';

import { assemblePassageText, formatReferenceLabel } from './passage.js';

describe('assemblePassageText', () => {
  it('joins verses in verse order with a single space', () => {
    const text = assemblePassageText([
      { verse: 2, text: 'segundo' },
      { verse: 1, text: 'primeiro' },
      { verse: 3, text: 'terceiro' },
    ]);
    expect(text).toBe('primeiro segundo terceiro');
  });

  it('trims surrounding whitespace of each verse', () => {
    const text = assemblePassageText([
      { verse: 1, text: '  No princípio ' },
      { verse: 2, text: 'criou Deus.  ' },
    ]);
    expect(text).toBe('No princípio criou Deus.');
  });

  it('returns an empty string for no verses', () => {
    expect(assemblePassageText([])).toBe('');
  });
});

describe('formatReferenceLabel', () => {
  it('renders a single verse without a range', () => {
    expect(formatReferenceLabel('João', 3, 16, 16)).toBe('João 3:16');
  });

  it('renders a verse range', () => {
    expect(formatReferenceLabel('João', 3, 16, 18)).toBe('João 3:16-18');
  });
});
