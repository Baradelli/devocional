import { readdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import type { ImportTranslationInput } from '../application/bible/ports.js';
import { createBibleModule } from '../infrastructure/bible/bibleModule.js';
import { loadEnv } from '../infrastructure/config/env.js';
import { createPrismaClient } from '../infrastructure/prisma/client.js';

/**
 * Importa as traduções dos arquivos .sqlite (pasta `bibles-sql/`) para o Postgres,
 * de forma idempotente, reusando o mesmo use-case `importTranslation`.
 * Cada arquivo é uma tradução: o código vem do nome do arquivo (ex.: NVI.sqlite →
 * "NVI") e o nome legível da tabela `metadata`.
 *
 * Uso:
 *   pnpm --filter @devocional/api import:bibles            # pasta padrão bibles-sql/
 *   pnpm --filter @devocional/api import:bibles ./outra/pasta
 */
interface BookRow {
  id: number;
  book_reference_id: number;
  testament_reference_id: number;
  name: string;
}
interface VerseRow {
  chapter: number;
  verse: number;
  text: string;
}

function readTranslation(filePath: string, code: string): ImportTranslationInput {
  const db = new DatabaseSync(filePath, { readOnly: true });
  try {
    const meta = db.prepare("SELECT value FROM metadata WHERE key = 'name'").get() as
      | { value: string }
      | undefined;
    const books = db
      .prepare(
        'SELECT id, book_reference_id, testament_reference_id, name FROM book ORDER BY book_reference_id',
      )
      .all() as unknown as BookRow[];
    const versesStmt = db.prepare(
      'SELECT chapter, verse, text FROM verse WHERE book_id = ? ORDER BY chapter, verse',
    );

    return {
      code,
      name: meta?.value ?? code,
      books: books.map((book) => ({
        bookReferenceId: book.book_reference_id,
        testamentReferenceId: book.testament_reference_id,
        name: book.name,
        verses: (versesStmt.all(book.id) as unknown as VerseRow[]).map((v) => ({
          chapter: v.chapter,
          verse: v.verse,
          text: v.text,
        })),
      })),
    };
  } finally {
    db.close();
  }
}

async function main(): Promise<void> {
  const env = loadEnv();
  const dir = process.argv[2] ?? fileURLToPath(new URL('../../bibles-sql', import.meta.url));
  const files = readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.sqlite'))
    .sort();

  if (files.length === 0) {
    process.stderr.write(`Nenhum arquivo .sqlite encontrado em ${dir}\n`);
    process.exit(1);
  }

  const prisma = createPrismaClient(env.DATABASE_URL);
  await prisma.$connect();
  const bible = createBibleModule(prisma);
  try {
    for (const file of files) {
      const code = path.basename(file, path.extname(file)).toUpperCase();
      const input = readTranslation(path.join(dir, file), code);
      const result = await bible.importTranslation(input);
      process.stdout.write(
        `${code} (${input.name}): ${String(result.bookCount)} livros, ${String(result.insertedVerseCount)} versículos novos.\n`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
