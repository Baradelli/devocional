import {
  type CalendarView,
  calendarViewSchema,
  type ProgressSnapshot,
  progressSnapshotSchema,
  type ProgressView,
  progressViewSchema,
  type SyncRequest,
} from '@devocional/shared';

import { apiRequest } from './client.js';

export function syncCompletions(request: SyncRequest): Promise<ProgressSnapshot> {
  return apiRequest('/progress/sync', progressSnapshotSchema, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function fetchProgress(): Promise<ProgressView> {
  return apiRequest('/progress', progressViewSchema);
}

/** Dias concluídos de um mês (YYYY-MM) para a semana e o calendário. */
export function fetchCalendar(month: string): Promise<CalendarView> {
  return apiRequest(`/progress/calendar?month=${month}`, calendarViewSchema);
}
