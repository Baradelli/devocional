import type { ReactNode } from 'react';

/**
 * Renderizador de markdown enxuto para o texto do devocional (## , ### , > ,
 * - , **negrito**, *itálico*). Gera elementos React — sem innerHTML, sem libs.
 */

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b${String(i)}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i${String(i)}`}>{match[2]}</em>);
    }
    last = regex.lastIndex;
    i++;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const lines = source.split('\n');
  const blocks: ReactNode[] = [];
  let list: ReactNode[] | null = null;
  let key = 0;

  const flushList = () => {
    if (list) {
      blocks.push(<ul key={`ul${String(key++)}`}>{list}</ul>);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      blocks.push(<h3 key={key++}>{inline(line.slice(4), `h3${String(key)}`)}</h3>);
    } else if (line.startsWith('## ')) {
      flushList();
      blocks.push(<h2 key={key++}>{inline(line.slice(3), `h2${String(key)}`)}</h2>);
    } else if (line.startsWith('> ')) {
      flushList();
      blocks.push(<blockquote key={key++}>{inline(line.slice(2), `bq${String(key)}`)}</blockquote>);
    } else if (line.startsWith('- ')) {
      list ??= [];
      list.push(<li key={`li${String(key++)}`}>{inline(line.slice(2), `li${String(key)}`)}</li>);
    } else {
      flushList();
      blocks.push(<p key={key++}>{inline(line, `p${String(key)}`)}</p>);
    }
  }
  flushList();

  return <div className={className}>{blocks}</div>;
}
