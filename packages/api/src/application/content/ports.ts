import type { BlockType, MediaType } from '@devocional/shared';

export interface PassageRefData {
  translationId: string;
  bookReferenceId: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

export interface CreateBlockData {
  type: BlockType;
  order: number;
  text: string | null;
  audioMediaId: string | null;
  gifMediaId: string | null;
  soundMediaId: string | null;
  reflectionQuestions: string[];
  reflectionActions: string[];
  passage: PassageRefData | null;
}

export interface CreateDevotionalData {
  date: string;
  theme: string | null;
  blocks: CreateBlockData[];
}

export interface UpdateDevotionalData {
  theme: string | null;
  blocks: CreateBlockData[];
}

export interface BlockRecord {
  type: BlockType;
  order: number;
  text: string | null;
  audioMediaId: string | null;
  gifMediaId: string | null;
  soundMediaId: string | null;
  reflectionQuestions: string[];
  reflectionActions: string[];
  passage: PassageRefData | null;
}

export interface DevotionalRecord {
  id: string;
  date: string;
  theme: string | null;
  blocks: BlockRecord[];
}

export interface DevotionalSummaryRecord {
  date: string;
  theme: string | null;
}

export interface DevotionalRepository {
  /** Cria o devocional e seus blocos atomicamente. Lança ContentError se a data já existe. */
  create(data: CreateDevotionalData): Promise<void>;
  /** Substitui tema e blocos de um devocional existente.
   * Lança ContentError('DEVOTIONAL_NOT_FOUND') se a data não existe. */
  update(date: string, data: UpdateDevotionalData): Promise<DevotionalSummaryRecord>;
  findByDate(date: string): Promise<DevotionalRecord | null>;
  listSummaries(): Promise<DevotionalSummaryRecord[]>;
}

export interface MediaRecord {
  id: string;
  type: MediaType;
  storageKey: string;
  mimetype: string;
  size: number;
  originalName: string | null;
  createdAt: Date;
}

export interface SaveMediaInput {
  data: Buffer;
  mimetype: string;
  originalName: string | null;
}

export interface MediaStorage {
  save(input: SaveMediaInput): Promise<{ storageKey: string; size: number }>;
  resolvePath(storageKey: string): string;
}

export interface MediaRepository {
  create(input: Omit<MediaRecord, 'id' | 'createdAt'>): Promise<MediaRecord>;
  findById(id: string): Promise<MediaRecord | null>;
}

/** Resolve o texto montado de uma passagem (implementado pelo módulo Bíblia). */
export type PassageResolver = (
  reference: PassageRefData,
) => Promise<{ label: string; text: string; verses: { verse: number; text: string }[] } | null>;
