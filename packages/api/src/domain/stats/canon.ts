import type { SectionKey, Testament } from '@devocional/shared';

/**
 * Estrutura canônica protestante (66 livros). Régua para agrupar a cobertura
 * por testamento e por seção. Funções puras — sem I/O. Os nomes dos livros (PT)
 * vêm da tradução no banco; aqui só a posição canônica (bookReferenceId 1..66).
 */

export const CANON_BOOK_COUNT = 66;

export const SECTION_KEYS: SectionKey[] = [
  'PENTATEUCH',
  'HISTORICAL',
  'POETIC',
  'PROPHETS',
  'GOSPELS',
  'EPISTLES',
  'REVELATION',
];

// Faixas de bookReferenceId por seção. GOSPELS inclui Atos (40–44).
const SECTION_RANGES: { key: SectionKey; first: number; last: number }[] = [
  { key: 'PENTATEUCH', first: 1, last: 5 },
  { key: 'HISTORICAL', first: 6, last: 17 },
  { key: 'POETIC', first: 18, last: 22 },
  { key: 'PROPHETS', first: 23, last: 39 },
  { key: 'GOSPELS', first: 40, last: 44 },
  { key: 'EPISTLES', first: 45, last: 65 },
  { key: 'REVELATION', first: 66, last: 66 },
];

function assertInCanon(bookReferenceId: number): void {
  if (
    !Number.isInteger(bookReferenceId) ||
    bookReferenceId < 1 ||
    bookReferenceId > CANON_BOOK_COUNT
  ) {
    throw new RangeError(`bookReferenceId fora do cânon: ${String(bookReferenceId)}`);
  }
}

export function testamentOf(bookReferenceId: number): Testament {
  assertInCanon(bookReferenceId);
  return bookReferenceId <= 39 ? 'OLD' : 'NEW';
}

export function sectionOf(bookReferenceId: number): SectionKey {
  assertInCanon(bookReferenceId);
  const match = SECTION_RANGES.find(
    (range) => bookReferenceId >= range.first && bookReferenceId <= range.last,
  );
  // Inalcançável: as faixas cobrem 1..66 sem buracos.
  if (!match) {
    throw new RangeError(`Sem seção para o livro ${String(bookReferenceId)}`);
  }
  return match.key;
}
