import type { CoverageStats, EngagementStats } from '@devocional/shared';
import type { PrismaClient } from '@prisma/client';

import { computeCoverageStats } from '../../application/stats/computeCoverageStats.js';
import { computeEngagementStats } from '../../application/stats/computeEngagementStats.js';
import { logicalDate } from '../../domain/gamification/logicalDate.js';
import { createStatsRepository } from './prismaStatsRepository.js';

/** Tradução-régua da cobertura (decisão de produto: ACF). */
const DEFAULT_RULER_CODE = 'ACF';
const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

export interface StatsModuleOptions {
  rulerCode?: string;
  /** Fuso do servidor para o dia lógico de referência do engajamento. */
  serverTimezone?: string;
  now?: () => Date;
}

export interface StatsModule {
  computeCoverage(): Promise<CoverageStats>;
  computeEngagement(): Promise<EngagementStats>;
}

export function createStatsModule(
  prisma: PrismaClient,
  options: StatsModuleOptions = {},
): StatsModule {
  const rulerCode = options.rulerCode ?? DEFAULT_RULER_CODE;
  const serverTimezone = options.serverTimezone ?? DEFAULT_TIMEZONE;
  const now = options.now ?? (() => new Date());
  const repo = createStatsRepository(prisma);
  return {
    computeCoverage: () => computeCoverageStats(repo, rulerCode),
    computeEngagement: () => computeEngagementStats(repo, logicalDate(now(), serverTimezone)),
  };
}
