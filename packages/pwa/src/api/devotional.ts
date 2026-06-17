import { type DevotionalView, devotionalViewSchema } from '@devocional/shared';

import { apiRequest } from './client.js';

export function fetchToday(): Promise<DevotionalView> {
  return apiRequest('/devotionals/today', devotionalViewSchema);
}
