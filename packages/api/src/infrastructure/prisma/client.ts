import { PrismaClient } from '@prisma/client';

/**
 * Fábrica do cliente Prisma. A `databaseUrl` é opcional para que os testes
 * de integração apontem para o Postgres efêmero do Testcontainers sem
 * depender de variáveis de ambiente do processo.
 */
export function createPrismaClient(databaseUrl?: string): PrismaClient {
  return new PrismaClient(databaseUrl ? { datasourceUrl: databaseUrl } : undefined);
}
