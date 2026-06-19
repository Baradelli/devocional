import type { CoverageStats } from '@devocional/shared';
import type { PrismaClient } from '@prisma/client';

import { computeCoverageStats } from '../../application/stats/computeCoverageStats.js';
import { createStatsRepository } from './prismaStatsRepository.js';

/** Tradução-régua da cobertura (decisão de produto: ACF). */
const DEFAULT_RULER_CODE = 'ACF';

export interface StatsModule {
  computeCoverage(): Promise<CoverageStats>;
}

export function createStatsModule(
  prisma: PrismaClient,
  rulerCode: string = DEFAULT_RULER_CODE,
): StatsModule {
  const repo = createStatsRepository(prisma);
  return {
    computeCoverage: () => computeCoverageStats(repo, rulerCode),
  };
}
