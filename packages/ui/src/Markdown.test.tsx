import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { Markdown } from './Markdown.js';

const html = (source: string) => renderToStaticMarkup(<Markdown source={source} />);

describe('Markdown', () => {
  test('renders headings, paragraphs and inline emphasis', () => {
    const out = html('## Título\n\nUm **forte** e um *suave*.');
    expect(out).toContain('<h2>Título</h2>');
    expect(out).toContain('<strong>forte</strong>');
    expect(out).toContain('<em>suave</em>');
  });

  test('renders ordered and unordered lists', () => {
    const out = html('- a\n- b\n\n1. um\n2. dois');
    expect(out).toContain('<ul>');
    expect(out).toContain('<ol>');
    expect(out).toContain('<li>a</li>');
    expect(out).toContain('<li>um</li>');
  });

  test('renders GFM tables', () => {
    const out = html('| livro | cap |\n| --- | --- |\n| Gênesis | 1 |');
    expect(out).toContain('<table>');
    expect(out).toContain('<th>livro</th>');
    expect(out).toContain('<td>Gênesis</td>');
  });

  test('renders blockquote, inline code and horizontal rule', () => {
    const out = html('> citação\n\n`código`\n\n---');
    expect(out).toContain('<blockquote>');
    expect(out).toContain('<code>código</code>');
    expect(out).toContain('<hr');
  });

  test('does not render inline images', () => {
    const out = html('texto ![alt](https://exemplo.com/foto.png) fim');
    expect(out).not.toContain('<img');
  });

  test('renders links opening in a new tab safely', () => {
    const out = html('[site](https://exemplo.com)');
    expect(out).toContain('href="https://exemplo.com"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  test('does not pass through raw HTML', () => {
    const out = html('<script>alert(1)</script>\n\n<b>negrito cru</b>');
    expect(out).not.toContain('<script>');
    expect(out).not.toContain('<b>negrito cru</b>');
  });
});
