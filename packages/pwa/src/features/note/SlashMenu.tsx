import type { Editor, Range } from '@tiptap/react';
import { forwardRef, type ReactNode, useEffect, useImperativeHandle, useState } from 'react';

export interface SlashItem {
  title: string;
  hint: string;
  icon: ReactNode;
  run: (editor: Editor, range: Range) => void;
}

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashMenuProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

/** Lista do slash menu (`/`): navegável por teclado e por toque. */
export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(function SlashMenu(
  { items, command },
  ref,
) {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (items.length === 0) {
        return false;
      }
      if (event.key === 'ArrowUp') {
        setSelected((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelected((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        const item = items[selected];
        if (item) {
          command(item);
        }
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return <div className="slash-menu slash-menu--empty">Nenhum bloco</div>;
  }

  return (
    <div className="slash-menu" role="listbox">
      {items.map((item, index) => (
        <button
          type="button"
          key={item.title}
          role="option"
          aria-selected={index === selected}
          className={index === selected ? 'slash-menu__item is-active' : 'slash-menu__item'}
          onMouseEnter={() => setSelected(index)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => command(item)}
        >
          <span className="slash-menu__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="slash-menu__text">
            <span className="slash-menu__title">{item.title}</span>
            <span className="slash-menu__hint">{item.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
});
