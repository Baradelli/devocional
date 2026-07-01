import { type Editor, useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  LuBold,
  LuCode,
  LuHeading2,
  LuHeading3,
  LuHighlighter,
  LuItalic,
  LuQuote,
} from 'react-icons/lu';

/** Barra flutuante que aparece sobre a seleção (estilo Notion). */
export function NoteBubbleMenu({ editor }: { editor: Editor }) {
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      highlight: editor.isActive('highlight'),
      code: editor.isActive('code'),
      h2: editor.isActive('heading', { level: 2 }),
      h3: editor.isActive('heading', { level: 3 }),
      quote: editor.isActive('blockquote'),
    }),
  });

  const btn = (on: boolean) => (on ? 'note-bubble__btn is-active' : 'note-bubble__btn');

  return (
    <BubbleMenu
      editor={editor}
      className="note-bubble"
      options={{ placement: 'top', offset: 8 }}
      appendTo={() => document.body}
    >
      <button
        type="button"
        className={btn(active.bold)}
        aria-label="Negrito"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <LuBold />
      </button>
      <button
        type="button"
        className={btn(active.italic)}
        aria-label="Itálico"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <LuItalic />
      </button>
      <button
        type="button"
        className={btn(active.highlight)}
        aria-label="Destaque"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <LuHighlighter />
      </button>
      <button
        type="button"
        className={btn(active.code)}
        aria-label="Código"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <LuCode />
      </button>
      <span className="note-bubble__sep" />
      <button
        type="button"
        className={btn(active.h2)}
        aria-label="Título"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <LuHeading2 />
      </button>
      <button
        type="button"
        className={btn(active.h3)}
        aria-label="Subtítulo"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <LuHeading3 />
      </button>
      <button
        type="button"
        className={btn(active.quote)}
        aria-label="Citação"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <LuQuote />
      </button>
    </BubbleMenu>
  );
}
