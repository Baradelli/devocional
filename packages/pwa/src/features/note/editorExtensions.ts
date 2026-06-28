import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import type { Extensions } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import markdownItMark from 'markdown-it-mark';
import { Markdown } from 'tiptap-markdown';

import { createSlashCommand } from './SlashCommand.js';

/** Highlight que serializa/parseia `==destaque==` para round-trip em Markdown. */
const MarkdownHighlight = Highlight.extend({
  addStorage() {
    return {
      markdown: {
        serialize: { open: '==', close: '==', mixable: true, expelEnclosingWhitespace: true },
        parse: {
          setup(md: { use: (...args: unknown[]) => unknown }) {
            md.use(markdownItMark);
          },
        },
      },
    };
  },
});

/** Conjunto de extensões do editor de anotações (estilo Notion/Obsidian). */
export function noteEditorExtensions(placeholder: string): Extensions {
  return [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    MarkdownHighlight,
    Placeholder.configure({ placeholder }),
    Markdown.configure({
      html: false,
      tightLists: true,
      bulletListMarker: '-',
      linkify: false,
      breaks: false,
      transformPastedText: true,
    }),
    createSlashCommand(),
  ];
}
