import type { Prisma, PrismaClient } from '@prisma/client';

import type {
  IdentityRepositories,
  InviteRepository,
  SessionRepository,
  UnitOfWork,
  UserRepository,
} from '../../application/identity/ports.js';

/** Aceita tanto o client raiz quanto o client transacional (`$transaction`). */
type PrismaLike = Pick<PrismaClient, 'user' | 'invite' | 'session'>;

function createUserRepository(db: PrismaLike): UserRepository {
  return {
    findById: (id) => db.user.findUnique({ where: { id } }),
    findByEmail: (email) => db.user.findUnique({ where: { email } }),
    create: (input) => db.user.create({ data: input }),
    markOnboardingCompleted: (id, at) =>
      db.user.update({ where: { id }, data: { onboardingCompletedAt: at } }),
  };
}

function createInviteRepository(db: PrismaLike): InviteRepository {
  return {
    findByCode: (code) => db.invite.findUnique({ where: { code } }),
    create: (input) => db.invite.create({ data: input }),
    async markUsed(id, usedById, usedAt) {
      await db.invite.update({ where: { id }, data: { status: 'USED', usedById, usedAt } });
    },
    listByCreator: (createdById) =>
      db.invite.findMany({ where: { createdById }, orderBy: { createdAt: 'desc' } }),
  };
}

function createSessionRepository(db: PrismaLike): SessionRepository {
  return {
    findByTokenHash: (tokenHash) => db.session.findUnique({ where: { tokenHash } }),
    create: (input) => db.session.create({ data: input }),
    async revoke(id, revokedAt) {
      await db.session.update({ where: { id }, data: { revokedAt } });
    },
  };
}

export function createIdentityRepositories(db: PrismaLike): IdentityRepositories {
  return {
    users: createUserRepository(db),
    invites: createInviteRepository(db),
    sessions: createSessionRepository(db),
  };
}

export function createPrismaUnitOfWork(prisma: PrismaClient): UnitOfWork {
  return {
    run: (work) =>
      prisma.$transaction((tx: Prisma.TransactionClient) => work(createIdentityRepositories(tx))),
  };
}
