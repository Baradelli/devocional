import type { ZodType } from 'zod';

function defaultApiBase(): string {
  // Usa o mesmo host de onde o app foi aberto (localhost OU IP da rede local,
  // para rodar pelo celular) na porta da API. Em produção, defina VITE_API_URL.
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return 'http://localhost:3000';
}

export const API_BASE = import.meta.env.VITE_API_URL ?? defaultApiBase();

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiErrorBody {
  message?: string;
}

export async function apiRequest<T>(
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });

  const raw = await response.text();
  const body: unknown = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    const message = (body as ApiErrorBody | null)?.message ?? 'Algo deu errado.';
    throw new ApiError(response.status, message);
  }

  return schema.parse(body);
}
