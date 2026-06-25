import type { CoverageStats } from '@devocional/shared';

/** Intensidade da célula por nº de citações do capítulo (0–3+). */
function level(citations: number): 0 | 1 | 2 | 3 {
  if (citations <= 0) return 0;
  if (citations === 1) return 1;
  if (citations === 2) return 2;
  return 3;
}

function BookRow({ book }: { book: CoverageStats['books'][number] }) {
  return (
    <div className="heat__row">
      <span className="heat__book" title={book.name}>
        {book.name}
      </span>
      <div className="heat__cells">
        {book.chapters.map((ch) => (
          <span
            key={ch.chapter}
            className="heat__cell"
            data-level={level(ch.citations)}
            title={`${book.name} ${String(ch.chapter)} — ${String(ch.citations)} citação(ões) · ${String(ch.coveredVerses)}/${String(ch.totalVerses)} versículos`}
          />
        ))}
      </div>
    </div>
  );
}

/** Mapa de cobertura: livros × capítulos; intensidade = vezes citado. */
export function CoverageHeatmap({ books }: { books: CoverageStats['books'] }) {
  const old = books.filter((b) => b.testament === 'OLD');
  const recent = books.filter((b) => b.testament === 'NEW');
  return (
    <div className="heat">
      <div className="heat__legend">
        <span>Menos</span>
        <span className="heat__cell" data-level={0} />
        <span className="heat__cell" data-level={1} />
        <span className="heat__cell" data-level={2} />
        <span className="heat__cell" data-level={3} />
        <span>Mais</span>
      </div>
      <div className="heat__group">
        <h4 className="heat__title">Antigo Testamento</h4>
        {old.map((book) => (
          <BookRow key={book.bookReferenceId} book={book} />
        ))}
      </div>
      <div className="heat__group">
        <h4 className="heat__title">Novo Testamento</h4>
        {recent.map((book) => (
          <BookRow key={book.bookReferenceId} book={book} />
        ))}
      </div>
    </div>
  );
}
