import { Extension, ReactRenderer } from '@tiptap/react';
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from '@tiptap/suggestion';

import { NOTE_BLOCKS } from './noteBlocks.js';
import { type SlashItem, SlashMenu, type SlashMenuRef } from './SlashMenu.js';

// Mesmos blocos da barra fixa; aqui o `/query` é apagado antes de aplicar.
const ITEMS: SlashItem[] = NOTE_BLOCKS.map((block) => ({
  title: block.title,
  hint: block.hint,
  icon: block.icon,
  run: (editor, range) => block.apply(editor.chain().focus().deleteRange(range)).run(),
}));

function makeRenderer() {
  let component: ReactRenderer<SlashMenuRef> | null = null;
  let wrapper: HTMLDivElement | null = null;

  const place = (clientRect?: (() => DOMRect | null) | null) => {
    if (!wrapper || !clientRect) {
      return;
    }
    const rect = clientRect();
    if (!rect) {
      return;
    }
    const margin = 8;
    wrapper.style.position = 'fixed';
    wrapper.style.left = `${Math.max(margin, Math.min(rect.left, window.innerWidth - wrapper.offsetWidth - margin))}px`;
    const below = rect.bottom + 6;
    const fitsBelow = below + wrapper.offsetHeight + margin <= window.innerHeight;
    wrapper.style.top = fitsBelow
      ? `${below}px`
      : `${Math.max(margin, rect.top - wrapper.offsetHeight - 6)}px`;
  };

  return {
    onStart: (props: SuggestionProps<SlashItem>) => {
      component = new ReactRenderer(SlashMenu, {
        props: props,
        editor: props.editor,
      });
      wrapper = document.createElement('div');
      wrapper.className = 'slash-popup';
      wrapper.appendChild(component.element);
      document.body.appendChild(wrapper);
      place(props.clientRect);
    },
    onUpdate: (props: SuggestionProps<SlashItem>) => {
      component?.updateProps(props);
      place(props.clientRect);
    },
    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (props.event.key === 'Escape') {
        return true;
      }
      return component?.ref?.onKeyDown(props) ?? false;
    },
    onExit: () => {
      wrapper?.remove();
      component?.destroy();
      wrapper = null;
      component = null;
    },
  };
}

/** Slash menu (`/`) que insere blocos sem tirar a mão do teclado. */
export function createSlashCommand() {
  return Extension.create({
    name: 'slashCommand',
    addProseMirrorPlugins() {
      return [
        Suggestion<SlashItem, SlashItem>({
          editor: this.editor,
          char: '/',
          allowSpaces: false,
          startOfLine: false,
          command: ({ editor, range, props }) => props.run(editor, range),
          items: ({ query }) =>
            ITEMS.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())),
          render: makeRenderer,
        }),
      ];
    },
  });
}
