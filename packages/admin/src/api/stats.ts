import { type CoverageStats, coverageStatsSchema } from '@devocional/shared';

import { apiRequest } from './client.js';

export function getCoverageStats(): Promise<CoverageStats> {
  return apiRequest('/admin/stats/coverage', coverageStatsSchema);
}
