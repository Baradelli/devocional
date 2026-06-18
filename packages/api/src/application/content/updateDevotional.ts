import type { DevotionalSummary, UpdateDevotionalRequest } from '@devocional/shared';

import { materializeBlocks } from './materializeBlocks.js';
import type { DevotionalRepository } from './ports.js';

/** Reescreve o conteúdo (tema + blocos) de um devocional já existente. */
export async function updateDevotional(
  repo: DevotionalRepository,
  date: string,
  input: UpdateDevotionalRequest,
): Promise<DevotionalSummary> {
  const updated = await repo.update(date, {
    theme: input.theme ?? null,
    blocks: materializeBlocks(input),
  });
  return {
    date: updated.date,
    theme: updated.theme,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
  };
}
