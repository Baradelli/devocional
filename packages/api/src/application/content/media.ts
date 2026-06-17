import type { MediaType } from '@devocional/shared';

import { ContentError } from './errors.js';
import type { MediaRecord, MediaRepository, MediaStorage } from './ports.js';

export interface UploadMediaDeps {
  storage: MediaStorage;
  media: MediaRepository;
}

export interface UploadMediaInput {
  type: MediaType;
  data: Buffer;
  mimetype: string;
  originalName: string | null;
}

export async function uploadMedia(
  deps: UploadMediaDeps,
  input: UploadMediaInput,
): Promise<MediaRecord> {
  const { storageKey, size } = await deps.storage.save({
    data: input.data,
    mimetype: input.mimetype,
    originalName: input.originalName,
  });
  return deps.media.create({
    type: input.type,
    storageKey,
    mimetype: input.mimetype,
    size,
    originalName: input.originalName,
  });
}

export interface ResolvedMedia {
  media: MediaRecord;
  absolutePath: string;
}

export async function resolveMediaForServe(
  deps: UploadMediaDeps,
  mediaId: string,
): Promise<ResolvedMedia> {
  const media = await deps.media.findById(mediaId);
  if (!media) {
    throw new ContentError('MEDIA_NOT_FOUND');
  }
  return { media, absolutePath: deps.storage.resolvePath(media.storageKey) };
}
