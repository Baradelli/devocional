import {
  type CreateDevotionalRequest,
  type DevotionalSummary,
  devotionalSummarySchema,
  type MediaType,
  type MediaView,
  mediaViewSchema,
} from '@devocional/shared';

import { API_BASE, ApiError, apiRequest } from './client.js';

interface ApiErrorBody {
  message?: string;
}

export async function uploadMedia(file: File, type: MediaType): Promise<MediaView> {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${API_BASE}/admin/media?type=${type}`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, (body as ApiErrorBody).message ?? 'Falha no envio.');
  }
  return mediaViewSchema.parse(body);
}

export function createDevotional(input: CreateDevotionalRequest): Promise<DevotionalSummary> {
  return apiRequest('/admin/devotionals', devotionalSummarySchema, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
