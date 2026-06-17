import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { MediaStorage, SaveMediaInput } from '../../application/content/ports.js';

const EXTENSION_BY_MIME: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/aac': '.aac',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'audio/webm': '.webm',
  'image/gif': '.gif',
};

function extensionFor(mimetype: string): string {
  return EXTENSION_BY_MIME[mimetype] ?? '';
}

/**
 * Storage de mídia em disco (v1), atrás da interface `MediaStorage` — trocável
 * por S3-compatível depois sem mexer no domínio. `baseDir` vem de `MEDIA_DIR`.
 */
export function createDiskMediaStorage(baseDir: string): MediaStorage {
  const root = path.resolve(baseDir);
  return {
    async save(input: SaveMediaInput) {
      await mkdir(root, { recursive: true });
      const storageKey = `${randomUUID()}${extensionFor(input.mimetype)}`;
      await writeFile(path.join(root, storageKey), input.data);
      return { storageKey, size: input.data.length };
    },
    resolvePath(storageKey: string) {
      return path.join(root, storageKey);
    },
  };
}
