import { describe, expect, it } from 'vitest';

import { materializeBlocks } from './materializeBlocks.js';

const content = {
  quote: { text: 'Comece aqui.' },
  passage: {
    reference: {
      translationId: 't1',
      bookReferenceId: 43,
      chapter: 3,
      verseStart: 16,
      verseEnd: 18,
    },
    audioMediaId: 'audio-passage',
  },
  devotional: { text: 'A reflexão.', audioMediaId: 'audio-dev' },
  prayer: { text: 'Senhor.', gifMediaId: 'gif-1', soundMediaId: 'sound-1' },
  reflection: {
    questions: ['q1', 'q2', 'q3'],
    actions: ['a1', 'a2', 'a3'],
  },
};

describe('materializeBlocks', () => {
  it('produces the fixed v1 sequence in order', () => {
    const blocks = materializeBlocks(content);
    expect(blocks.map((b) => b.type)).toEqual([
      'QUOTE',
      'PASSAGE',
      'DEVOTIONAL',
      'PRAYER',
      'REFLECTION',
    ]);
    expect(blocks.map((b) => b.order)).toEqual([0, 1, 2, 3, 4]);
  });

  it('routes media ids and passage reference to the right blocks', () => {
    const [quote, passage, devotional, prayer, reflection] = materializeBlocks(content);
    expect(quote?.text).toBe('Comece aqui.');
    expect(passage?.passage).toEqual(content.passage.reference);
    expect(passage?.audioMediaId).toBe('audio-passage');
    expect(devotional?.audioMediaId).toBe('audio-dev');
    expect(prayer?.gifMediaId).toBe('gif-1');
    expect(prayer?.soundMediaId).toBe('sound-1');
    expect(reflection?.reflectionQuestions).toEqual(['q1', 'q2', 'q3']);
    expect(reflection?.reflectionActions).toEqual(['a1', 'a2', 'a3']);
  });

  it('defaults optional media to null', () => {
    const minimal = {
      quote: { text: 'q' },
      passage: { reference: content.passage.reference },
      devotional: { text: 'd' },
      prayer: { text: 'p' },
      reflection: { questions: ['a', 'b', 'c'], actions: ['d', 'e', 'f'] },
    };
    const [, passage, , prayer] = materializeBlocks(minimal);
    expect(passage?.audioMediaId).toBeNull();
    expect(prayer?.gifMediaId).toBeNull();
    expect(prayer?.soundMediaId).toBeNull();
  });
});
