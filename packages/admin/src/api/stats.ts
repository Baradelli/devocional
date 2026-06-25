import {
  type CoverageStats,
  coverageStatsSchema,
  type EngagementStats,
  engagementStatsSchema,
  type Roster,
  rosterSchema,
} from '@devocional/shared';

import { apiRequest } from './client.js';

export function getCoverageStats(): Promise<CoverageStats> {
  return apiRequest('/admin/stats/coverage', coverageStatsSchema);
}

export function getEngagementStats(): Promise<EngagementStats> {
  return apiRequest('/admin/stats/engagement', engagementStatsSchema);
}

export function getRoster(): Promise<Roster> {
  return apiRequest('/admin/users', rosterSchema);
}
