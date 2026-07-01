import type { ChainedCommands, Editor } from '@tiptap/react';
import { createElement, type ReactNode } from 'react';
import {
  LuCode,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuList,
  LuListChecks,
  LuMinus,
  LuQuote,
} from 'react-icons/lu';

/**
 * Blocos do editor de anotações. Fonte única tanto do menu `/` quanto da barra
 * fixa: `apply` recebe a chain já focada (o `/` deleta o range antes) e devolve
 * a chain para encadear o `.run()`; `isActive` pinta o bloco atual na barra.
 */
export interface NoteBlock {
  key: string;
  /** Início de um novo grupo visual (separador antes dele na barra). */
  group?: boolean;
  title: string;
  hint: string;
  icon: ReactNode;
  apply: (chain: ChainedCommands) => ChainedCommands;
  isActive: (editor: Editor) => boolean;
}

export const NOTE_BLOCKS: NoteBlock[] = [
  {
    key: 'h1',
    title: 'Título',
    hint: 'Seção grande',
    icon: createElement(LuHeading1),
    apply: (chain) => chain.toggleHeading({ level: 1 }),
    isActive: (editor) => editor.isActive('heading', { level: 1 }),
  },
  {
    key: 'h2',
    title: 'Subtítulo',
    hint: 'Seção média',
    icon: createElement(LuHeading2),
    apply: (chain) => chain.toggleHeading({ level: 2 }),
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
  },
  {
    key: 'h3',
    title: 'Sub-subtítulo',
    hint: 'Seção pequena',
    icon: createElement(LuHeading3),
    apply: (chain) => chain.toggleHeading({ level: 3 }),
    isActive: (editor) => editor.isActive('heading', { level: 3 }),
  },
  {
    key: 'bullet',
    group: true,
    title: 'Lista',
    hint: 'Itens com marcador',
    icon: createElement(LuList),
    apply: (chain) => chain.toggleBulletList(),
    isActive: (editor) => editor.isActive('bulletList'),
  },
  {
    key: 'task',
    title: 'Tarefas',
    hint: 'Lista com caixas',
    icon: createElement(LuListChecks),
    apply: (chain) => chain.toggleTaskList(),
    isActive: (editor) => editor.isActive('taskList'),
  },
  {
    key: 'quote',
    group: true,
    title: 'Citação',
    hint: 'Destacar um trecho',
    icon: createElement(LuQuote),
    apply: (chain) => chain.toggleBlockquote(),
    isActive: (editor) => editor.isActive('blockquote'),
  },
  {
    key: 'code',
    title: 'Código',
    hint: 'Bloco monoespaçado',
    icon: createElement(LuCode),
    apply: (chain) => chain.toggleCodeBlock(),
    isActive: (editor) => editor.isActive('codeBlock'),
  },
  {
    key: 'hr',
    group: true,
    title: 'Divisória',
    hint: 'Separar seções',
    icon: createElement(LuMinus),
    apply: (chain) => chain.setHorizontalRule(),
    isActive: () => false,
  },
];
