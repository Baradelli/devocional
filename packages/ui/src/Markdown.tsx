import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renderiza CommonMark + GFM do texto devocional/oração. Imagem inline é
 * bloqueada (mídia entra só por upload) e HTML cru fica desligado por padrão
 * do react-markdown; links abrem em nova aba de forma segura.
 */
const components: Components = {
  img: () => null,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
