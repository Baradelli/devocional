import type {
  CreateDevotionalRequest,
  DevotionalSummary,
  DevotionalView,
  UpdateDevotionalRequest,
} from '@devocional/shared';
import type { PrismaClient } from '@prisma/client';

import { createDevotional } from '../../application/content/createDevotional.js';
import { getDevotionalForDate } from '../../application/content/getDevotional.js';
import {
  type ResolvedMedia,
  resolveMediaForServe,
  uploadMedia,
  type UploadMediaInput,
} from '../../application/content/media.js';
import type { MediaRecord, PassageResolver } from '../../application/content/ports.js';
import { updateDevotional } from '../../application/content/updateDevotional.js';
import { logicalDate } from '../../domain/gamification/logicalDate.js';
import type { BibleModule } from '../bible/bibleModule.js';
import { createSystemClock } from '../clock.js';
import { createDiskMediaStorage } from './diskMediaStorage.js';
import { createContentRepository } from './prismaContentRepository.js';
import { createMediaRepository } from './prismaMediaRepository.js';

export interface ContentModuleConfig {
  mediaDir: string;
}

export interface ContentModule {
  createDevotional(input: CreateDevotionalRequest): Promise<void>;
  updateDevotional(date: string, input: UpdateDevotionalRequest): Promise<DevotionalSummary>;
  getDevotionalForDate(date: string): Promise<DevotionalView>;
  /** Devocional do dia lógico do usuário (tela "Hoje" do fiel). */
  getTodayDevotional(timezone: string): Promise<DevotionalView>;
  listDevotionals(): Promise<DevotionalSummary[]>;
  uploadMedia(input: UploadMediaInput): Promise<MediaRecord>;
  resolveMediaForServe(mediaId: string): Promise<ResolvedMedia>;
}

export function createContentModule(
  prisma: PrismaClient,
  bible: BibleModule,
  config: ContentModuleConfig,
): ContentModule {
  const repo = createContentRepository(prisma);
  const mediaRepo = createMediaRepository(prisma);
  const storage = createDiskMediaStorage(config.mediaDir);
  const clock = createSystemClock();

  // O módulo Conteúdo conversa com o módulo Bíblia por esta interface fina.
  const resolvePassage: PassageResolver = async (reference) => {
    try {
      const preview = await bible.getPassagePreview(reference);
      return { label: preview.label, text: preview.text, verses: preview.verses };
    } catch {
      return null;
    }
  };

  const mediaDeps = { storage, media: mediaRepo };

  return {
    createDevotional: (input) => createDevotional(repo, input),
    updateDevotional: (date, input) => updateDevotional(repo, date, input),
    getDevotionalForDate: (date) => getDevotionalForDate({ repo, resolvePassage }, date),
    // A disponibilidade é puramente por data: o devocional do dia lógico do
    // usuário já está no ar. getDevotionalForDate lança 404 se não existir.
    getTodayDevotional: (timezone) =>
      getDevotionalForDate({ repo, resolvePassage }, logicalDate(clock.now(), timezone)),
    listDevotionals: () => repo.listSummaries(),
    uploadMedia: (input) => uploadMedia(mediaDeps, input),
    resolveMediaForServe: (mediaId) => resolveMediaForServe(mediaDeps, mediaId),
  };
}
