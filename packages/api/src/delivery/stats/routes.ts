import { coverageStatsSchema } from '@devocional/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import type { StatsModule } from '../../infrastructure/stats/statsModule.js';
import { requireAdmin } from '../identity/guards.js';

export interface StatsRoutesOptions {
  stats: StatsModule;
}

export const statsRoutes: FastifyPluginAsync<StatsRoutesOptions> = (app, opts) => {
  const { stats } = opts;
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    '/admin/stats/coverage',
    { preHandler: requireAdmin, schema: { response: { 200: coverageStatsSchema } } },
    () => stats.computeCoverage(),
  );

  return Promise.resolve();
};
