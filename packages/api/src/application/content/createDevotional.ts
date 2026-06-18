import type { CreateDevotionalRequest } from '@devocional/shared';

import { materializeBlocks } from './materializeBlocks.js';
import type { DevotionalRepository } from './ports.js';

export async function createDevotional(
  repo: DevotionalRepository,
  input: CreateDevotionalRequest,
): Promise<void> {
  await repo.create({
    date: input.date,
    theme: input.theme ?? null,
    blocks: materializeBlocks(input),
  });
}
