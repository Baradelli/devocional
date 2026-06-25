import type { Prisma, PrismaClient } from '@prisma/client';

import type {
  IdentityRepositories,
  InviteRecord,
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
    async delete(id) {
      await db.user.delete({ where: { id } });
    },
  };
}

// Inclui o relacionamento usedBy (nome+email de quem resgatou) e o achata no
// formato de InviteRecord. Convite não-usado tem usedBy = null.
const inviteInclude = { usedBy: { select: { name: true, email: true } } } as const;

type InviteRow = Prisma.InviteGetPayload<{ include: typeof inviteInclude }>;

function toInviteRecord(row: InviteRow): InviteRecord {
  return {
    id: row.id,
    code: row.code,
    email: row.email,
    status: row.status,
    expiresAt: row.expiresAt,
    createdById: row.createdById,
    usedById: row.usedById,
    usedAt: row.usedAt,
    createdAt: row.createdAt,
    usedBy: row.usedBy,
  };
}

function createInviteRepository(db: PrismaLike): InviteRepository {
  return {
    async findById(id) {
      const row = await db.invite.findUnique({ where: { id }, include: inviteInclude });
      return row && toInviteRecord(row);
    },
    async findByCode(code) {
      const row = await db.invite.findUnique({ where: { code }, include: inviteInclude });
      return row && toInviteRecord(row);
    },
    async create(input) {
      return toInviteRecord(await db.invite.create({ data: input, include: inviteInclude }));
    },
    async markUsed(id, usedById, usedAt) {
      await db.invite.update({ where: { id }, data: { status: 'USED', usedById, usedAt } });
    },
    async revoke(id) {
      return toInviteRecord(
        await db.invite.update({
          where: { id },
          data: { status: 'REVOKED' },
          include: inviteInclude,
        }),
      );
    },
    async listByCreator(createdById) {
      const rows = await db.invite.findMany({
        where: { createdById },
        orderBy: { createdAt: 'desc' },
        include: inviteInclude,
      });
      return rows.map(toInviteRecord);
    },
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
