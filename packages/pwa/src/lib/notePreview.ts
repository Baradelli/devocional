/**
 * Deriva título e preview em texto puro do corpo Markdown de uma anotação, para
 * a biblioteca e a busca. Stripper leve por regex (puro, sem DOM) — o conteúdo
 * é CommonMark + GFM, conforme a convenção do projeto.
 */

const INLINE: Array<[RegExp, string]> = [
  [/!\[[^\]]*\]\([^)]*\)/g, ''], // imagens
  [/\[([^\]]*)\]\([^)]*\)/g, '$1'], // links -> texto
  [/`([^`]+)`/g, '$1'], // código inline
  [/==([^=]+)==/g, '$1'], // destaque
  [/\*\*([^*]+)\*\*/g, '$1'], // negrito
  [/__([^_]+)__/g, '$1'],
  [/~~([^~]+)~~/g, '$1'], // tachado
  [/\*([^*]+)\*/g, '$1'], // itálico
  [/_([^_]+)_/g, '$1'],
];

function stripInline(text: string): string {
  let out = text;
  for (const [pattern, replacement] of INLINE) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function stripBlockMarkers(line: string): string {
  return line
    .replace(/^\s{0,3}#{1,6}\s+/, '') // heading ATX
    .replace(/^\s*>\s?/, '') // citação
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/, '') // item de tarefa
    .replace(/^\s*[-*+]\s+/, '') // lista
    .replace(/^\s*\d+\.\s+/, ''); // lista ordenada
}

const cleanLine = (line: string): string => stripInline(stripBlockMarkers(line));

export function stripMarkdown(md: string): string {
  return md.split('\n').map(cleanLine).join(' ').replace(/\s+/g, ' ').trim();
}

/** Vazia quando o markdown, sem marcação, não tem texto algum. */
export function isBlank(md: string): boolean {
  return stripMarkdown(md).length === 0;
}

export function summarize(md: string): { title: string; preview: string } {
  const preview = stripMarkdown(md);
  const headingLine = md.split('\n').find((line) => /^\s{0,3}#{1,6}\s+\S/.test(line));
  let title = headingLine
    ? cleanLine(headingLine).trim()
    : (
        md
          .split('\n')
          .map(cleanLine)
          .find((line) => line.trim().length > 0) ?? ''
      )
        .trim()
        .slice(0, 40);
  if (title.length === 0) {
    title = 'Anotação';
  }
  return { title, preview };
}
