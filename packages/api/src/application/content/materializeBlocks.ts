import type { CreateDevotionalRequest } from '@devocional/shared';

import type { CreateBlockData } from './ports.js';

/** Conteúdo do devocional sem os metadados (data/tema): só os blocos. */
export type DevotionalContent = Omit<CreateDevotionalRequest, 'date' | 'theme'>;

/**
 * Materializa o payload por seção (sequência fixa do v1) em blocos ordenados:
 * 0 frase, 1 passagem, 2 devocional, 3 oração, 4 reflexão. Compartilhado pela
 * criação e pela edição (ambas reescrevem o conjunto completo de blocos).
 */
export function materializeBlocks(input: DevotionalContent): CreateBlockData[] {
  return [
    {
      type: 'QUOTE',
      order: 0,
      text: input.quote.text,
      audioMediaId: null,
      gifMediaId: null,
      soundMediaId: null,
      reflectionQuestions: [],
      reflectionActions: [],
      passage: null,
    },
    {
      type: 'PASSAGE',
      order: 1,
      text: null,
      audioMediaId: input.passage.audioMediaId ?? null,
      gifMediaId: null,
      soundMediaId: null,
      reflectionQuestions: [],
      reflectionActions: [],
      passage: input.passage.reference,
    },
    {
      type: 'DEVOTIONAL',
      order: 2,
      text: input.devotional.text,
      audioMediaId: input.devotional.audioMediaId ?? null,
      gifMediaId: null,
      soundMediaId: null,
      reflectionQuestions: [],
      reflectionActions: [],
      passage: null,
    },
    {
      type: 'PRAYER',
      order: 3,
      text: input.prayer.text,
      audioMediaId: input.prayer.audioMediaId ?? null,
      gifMediaId: input.prayer.gifMediaId ?? null,
      soundMediaId: input.prayer.soundMediaId ?? null,
      reflectionQuestions: [],
      reflectionActions: [],
      passage: null,
    },
    {
      type: 'REFLECTION',
      order: 4,
      text: null,
      audioMediaId: input.reflection.audioMediaId ?? null,
      gifMediaId: null,
      soundMediaId: null,
      reflectionQuestions: input.reflection.questions,
      reflectionActions: input.reflection.actions,
      passage: null,
    },
  ];
}
