import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import { createBibleModule } from '../infrastructure/bible/bibleModule.js';
import { loadEnv } from '../infrastructure/config/env.js';
import { createPrismaClient } from '../infrastructure/prisma/client.js';

/**
 * Importa uma tradução (formato normalizado book/verse) de forma idempotente.
 * Uso:
 *   pnpm --filter @devocional/api exec tsx src/scripts/importBible.ts [arquivo.json]
 * Sem argumento, importa a tradução de demonstração.
 *
 * O adaptador de um dump SQL específico é uma camada fina que converte o dump
 * para este formato e chama o mesmo importador.
 */
const importInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  books: z
    .array(
      z.object({
        bookReferenceId: z.number().int().positive(),
        testamentReferenceId: z.number().int().positive(),
        name: z.string().min(1),
        verses: z.array(
          z.object({
            chapter: z.number().int().positive(),
            verse: z.number().int().positive(),
            text: z.string().min(1),
          }),
        ),
      }),
    )
    .min(1),
});

const defaultSample = fileURLToPath(
  new URL('../../prisma/seed-data/sample-translation.json', import.meta.url),
);

async function main(): Promise<void> {
  const env = loadEnv();
  const path = process.argv[2] ?? defaultSample;
  const input = importInputSchema.parse(JSON.parse(readFileSync(path, 'utf8')));

  const prisma = createPrismaClient(env.DATABASE_URL);
  await prisma.$connect();
  try {
    const result = await createBibleModule(prisma).importTranslation(input);
    process.stdout.write(
      `Importado ${input.code}: ${String(result.bookCount)} livros, ${String(result.insertedVerseCount)} versículos novos.\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
