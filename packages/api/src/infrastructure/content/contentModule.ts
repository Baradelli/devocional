import type {
  CreateDevotionalRequest,
  DevotionalSummary,
  DevotionalView,
} from '@devocional/shared';
import type { PrismaClient } from '@prisma/client';

import { createDevotional } from '../../application/content/createDevotional.js';
import { ContentError } from '../../application/content/errors.js';
import { getDevotionalForDate } from '../../application/content/getDevotional.js';
import {
  type ResolvedMedia,
  resolveMediaForServe,
  uploadMedia,
  type UploadMediaInput,
} from '../../application/content/media.js';
import type { MediaRecord, PassageResolver } from '../../application/content/ports.js';
import { publishDueDevotionals } from '../../application/content/publishDueDevotionals.js';
import { logicalDate } from '../../domain/gamification/logicalDate.js';
import type { BibleModule } from '../bible/bibleModule.js';
import { createSystemClock } from '../clock.js';
import { createDiskMediaStorage } from './diskMediaStorage.js';
import { createContentRepository } from './prismaContentRepository.js';
import { createMediaRepository } from './prismaMediaRepository.js';

export interface ContentModuleConfig {
  mediaDir: string;
  serverTimezone: string;
}

export interface ContentModule {
  createDevotional(input: CreateDevotionalRequest): Promise<void>;
  getDevotionalForDate(date: string): Promise<DevotionalView>;
  /** Devocional publicado do dia lógico do usuário (tela "Hoje" do fiel). */
  getTodayDevotional(timezone: string): Promise<DevotionalView>;
  listDevotionals(): Promise<DevotionalSummary[]>;
  publishDue(): Promise<number>;
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
      return { label: preview.label, text: preview.text };
    } catch {
      return null;
    }
  };

  const mediaDeps = { storage, media: mediaRepo };

  return {
    createDevotional: (input) => createDevotional(repo, input),
    getDevotionalForDate: (date) => getDevotionalForDate({ repo, resolvePassage }, date),
    getTodayDevotional: async (timezone) => {
      const date = logicalDate(clock.now(), timezone);
      const record = await repo.findByDate(date);
      if (!record || !record.publishedAt) {
        throw new ContentError('DEVOTIONAL_NOT_FOUND');
      }
      return getDevotionalForDate({ repo, resolvePassage }, date);
    },
    listDevotionals: async () => {
      const summaries = await repo.listSummaries();
      return summaries.map((s) => ({
        date: s.date,
        theme: s.theme,
        publishedAt: s.publishedAt?.toISOString() ?? null,
      }));
    },
    publishDue: () => publishDueDevotionals({ repo, clock, serverTimezone: config.serverTimezone }),
    uploadMedia: (input) => uploadMedia(mediaDeps, input),
    resolveMediaForServe: (mediaId) => resolveMediaForServe(mediaDeps, mediaId),
  };
}
