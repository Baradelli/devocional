import { describe, expect, it } from 'vitest';

import { isBlank, stripMarkdown, summarize } from './notePreview.js';

describe('summarize', () => {
  it('uses the first ATX heading as the title', () => {
    expect(summarize('# Gratidão de hoje\n\nUm parágrafo qualquer.').title).toBe(
      'Gratidão de hoje',
    );
  });

  it('uses a deeper heading as the title too', () => {
    expect(summarize('### Pedido\n\ntexto').title).toBe('Pedido');
  });

  it('falls back to the first non-empty line, stripped and trimmed', () => {
    expect(summarize('uma reflexão **forte** sobre o dia').title).toBe(
      'uma reflexão forte sobre o dia',
    );
  });

  it('caps the fallback title length', () => {
    const long = 'a'.repeat(120);
    expect(summarize(long).title.length).toBeLessThanOrEqual(40);
  });

  it('defaults the title to Anotação when empty', () => {
    expect(summarize('').title).toBe('Anotação');
    expect(summarize('   \n  ').title).toBe('Anotação');
  });

  it('builds a plain-text preview across the whole note', () => {
    const { preview } = summarize('# Título\n\nLinha *um*.\n\n- item a\n- item b');
    expect(preview).toBe('Título Linha um. item a item b');
  });
});

describe('stripMarkdown', () => {
  it('removes heading markers', () => {
    expect(stripMarkdown('## Olá')).toBe('Olá');
  });

  it('removes emphasis, bold, code and highlight markers', () => {
    expect(stripMarkdown('**a** *b* `c` ==d== _e_')).toBe('a b c d e');
  });

  it('keeps link text and drops the url', () => {
    expect(stripMarkdown('veja [o site](https://x.com) agora')).toBe('veja o site agora');
  });

  it('drops images entirely', () => {
    expect(stripMarkdown('antes ![alt](foto.png) depois')).toBe('antes depois');
  });

  it('removes list, task and blockquote markers', () => {
    expect(stripMarkdown('- [ ] fazer\n- [x] feito\n> citação\n1. primeiro')).toBe(
      'fazer feito citação primeiro',
    );
  });

  it('collapses whitespace', () => {
    expect(stripMarkdown('a\n\n\nb   c')).toBe('a b c');
  });
});

describe('isBlank', () => {
  it('is true for empty or whitespace-only content', () => {
    expect(isBlank('')).toBe(true);
    expect(isBlank('   \n\t  ')).toBe(true);
  });

  it('is true for markdown that strips to nothing', () => {
    expect(isBlank('##   \n\n> \n- [ ] ')).toBe(true);
  });

  it('is false when there is real text', () => {
    expect(isBlank('# título')).toBe(false);
    expect(isBlank('oi')).toBe(false);
  });
});
