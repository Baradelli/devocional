import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
  COOKIE_NAME: z.string().min(1).default('devocional_session'),
  MEDIA_DIR: z.string().min(1).default('media-storage'),
  SERVER_TIMEZONE: z.string().min(1).default('America/Sao_Paulo'),
  // Origens permitidas (CORS) — frontends em dev. CSV.
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:5174')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
