export interface VerseText {
  verse: number;
  text: string;
}

/**
 * Monta o texto de uma passagem a partir dos versículos (regra pura). Ordena
 * por número de versículo e junta com um espaço. O texto canônico vive na
 * tabela `Verse`; o devocional guarda apenas a referência (ADR-006).
 */
export function assemblePassageText(verses: VerseText[]): string {
  return [...verses]
    .sort((a, b) => a.verse - b.verse)
    .map((v) => v.text.trim())
    .join(' ')
    .trim();
}

/** Rótulo humano da referência, ex.: "João 3:16" ou "João 3:16-18". */
export function formatReferenceLabel(
  bookName: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
): string {
  const range = verseEnd > verseStart ? `${verseStart}-${verseEnd}` : `${verseStart}`;
  return `${bookName} ${chapter}:${range}`;
}
