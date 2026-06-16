# infrastructure

Adapters: repositórios Prisma, clients externos. Implementam as portas
declaradas pelas camadas internas. É a única camada que conhece Prisma/IO.

M0: `prisma/client.ts` — fábrica do `PrismaClient`.
