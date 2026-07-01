import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
  // Interface de bind. Em produção use 127.0.0.1 (só o proxy reverso alcança);
  // 0.0.0.0 em dev permite abrir pelo celular via IP da rede local.
  HOST: z.string().min(1).default('0.0.0.0'),
  COOKIE_NAME: z.string().min(1).default('devocional_session'),
  MEDIA_DIR: z.string().min(1).default('media-storage'),
  SERVER_TIMEZONE: z.string().min(1).default('America/Sao_Paulo'),
  // Web Push (VAPID). Sem as chaves, o canal de push vira no-op logado.
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:contato@devocional.app'),
  // URL do app do fiel, usada no clique da notificação.
  APP_URL: z.string().url().default('http://localhost:5173'),
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
