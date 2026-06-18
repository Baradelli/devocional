import type { BlockView, DevotionalView } from '@devocional/shared';

import { ContentError } from './errors.js';
import type { BlockRecord, DevotionalRepository, PassageResolver } from './ports.js';

export interface GetDevotionalDeps {
  repo: DevotionalRepository;
  resolvePassage: PassageResolver;
}

function mediaUrl(mediaId: string | null): string | null {
  return mediaId ? `/media/${mediaId}` : null;
}

async function assembleBlock(block: BlockRecord, resolve: PassageResolver): Promise<BlockView> {
  switch (block.type) {
    case 'QUOTE':
      return { type: 'QUOTE', order: block.order, text: block.text ?? '' };
    case 'PASSAGE': {
      if (!block.passage) {
        throw new ContentError('PASSAGE_UNAVAILABLE');
      }
      const resolved = await resolve(block.passage);
      if (!resolved) {
        throw new ContentError('PASSAGE_UNAVAILABLE');
      }
      return {
        type: 'PASSAGE',
        order: block.order,
        label: resolved.label,
        text: resolved.text,
        verses: resolved.verses,
        reference: block.passage,
        audioUrl: mediaUrl(block.audioMediaId),
      };
    }
    case 'DEVOTIONAL':
      return {
        type: 'DEVOTIONAL',
        order: block.order,
        text: block.text ?? '',
        audioUrl: mediaUrl(block.audioMediaId),
      };
    case 'PRAYER':
      return {
        type: 'PRAYER',
        order: block.order,
        text: block.text ?? '',
        audioUrl: mediaUrl(block.audioMediaId),
        gifUrl: mediaUrl(block.gifMediaId),
        soundUrl: mediaUrl(block.soundMediaId),
      };
    case 'REFLECTION':
      return {
        type: 'REFLECTION',
        order: block.order,
        questions: block.reflectionQuestions,
        actions: block.reflectionActions,
        audioUrl: mediaUrl(block.audioMediaId),
      };
  }
}

/** Monta a visão do devocional de uma data (preview do admin; base da tela do fiel). */
export async function getDevotionalForDate(
  deps: GetDevotionalDeps,
  date: string,
): Promise<DevotionalView> {
  const devotional = await deps.repo.findByDate(date);
  if (!devotional) {
    throw new ContentError('DEVOTIONAL_NOT_FOUND');
  }

  const blocks = await Promise.all(
    devotional.blocks.map((block) => assembleBlock(block, deps.resolvePassage)),
  );

  return {
    id: devotional.id,
    date: devotional.date,
    theme: devotional.theme,
    publishedAt: devotional.publishedAt?.toISOString() ?? null,
    blocks,
  };
}
