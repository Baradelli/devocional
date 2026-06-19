import {
  type CoverageStats,
  coverageStatsSchema,
  type EngagementStats,
  engagementStatsSchema,
} from '@devocional/shared';

import { apiRequest } from './client.js';

export function getCoverageStats(): Promise<CoverageStats> {
  return apiRequest('/admin/stats/coverage', coverageStatsSchema);
}

export function getEngagementStats(): Promise<EngagementStats> {
  return apiRequest('/admin/stats/engagement', engagementStatsSchema);
}
