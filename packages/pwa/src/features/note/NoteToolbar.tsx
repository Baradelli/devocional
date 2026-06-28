import { type Editor, useEditorState } from '@tiptap/react';
import { Fragment } from 'react';

import { NOTE_BLOCKS } from './noteBlocks.js';

/** Barra fixa no topo da anotação com os mesmos blocos do menu `/`. */
export function NoteToolbar({ editor }: { editor: Editor }) {
  const active = useEditorState({
    editor,
    selector: ({ editor }) => NOTE_BLOCKS.map((block) => block.isActive(editor)),
  });

  return (
    <div className="note-toolbar" role="toolbar" aria-label="Blocos">
      {NOTE_BLOCKS.map((block, index) => (
        <Fragment key={block.key}>
          {block.group && index > 0 && <span className="note-toolbar__sep" aria-hidden="true" />}
          <button
            type="button"
            className={active[index] ? 'note-toolbar__btn is-active' : 'note-toolbar__btn'}
            aria-label={block.title}
            aria-pressed={active[index]}
            title={block.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => block.apply(editor.chain().focus()).run()}
          >
            {block.icon}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
