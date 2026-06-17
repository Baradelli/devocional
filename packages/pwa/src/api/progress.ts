import {
  type ProgressSnapshot,
  progressSnapshotSchema,
  type SyncRequest,
} from '@devocional/shared';

import { apiRequest } from './client.js';

export function syncCompletions(request: SyncRequest): Promise<ProgressSnapshot> {
  return apiRequest('/progress/sync', progressSnapshotSchema, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
