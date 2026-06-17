import type { PrismaClient } from '@prisma/client';

import { authenticate } from '../../application/identity/authenticate.js';
import type { AuthResult } from '../../application/identity/authResult.js';
import { completeOnboarding } from '../../application/identity/completeOnboarding.js';
import {
  createAdminUser,
  type CreateAdminUserInput,
} from '../../application/identity/createAdminUser.js';
import { createInvite, type CreateInviteInput } from '../../application/identity/createInvite.js';
import { deleteAccount } from '../../application/identity/deleteAccount.js';
import { login, type LoginInput } from '../../application/identity/login.js';
import { logout } from '../../application/identity/logout.js';
import type { InviteRecord, UserRecord } from '../../application/identity/ports.js';
import {
  registerWithInvite,
  type RegisterWithInviteInput,
} from '../../application/identity/registerWithInvite.js';
import { createSystemClock } from '../clock.js';
import { createScryptPasswordHasher } from './passwordHasher.js';
import { createIdentityRepositories, createPrismaUnitOfWork } from './prismaRepositories.js';
import { createCryptoTokenGenerator, createInviteCodeGenerator } from './tokens.js';

/**
 * Composition root da identidade: liga as portas (repos Prisma, scrypt, tokens,
 * clock) aos use-cases e expõe uma fachada fina para a camada de delivery.
 */
export interface IdentityModule {
  registerWithInvite(input: RegisterWithInviteInput): Promise<AuthResult>;
  login(input: LoginInput): Promise<AuthResult>;
  logout(rawToken: string): Promise<void>;
  authenticate(rawToken: string): Promise<UserRecord | null>;
  createInvite(input: CreateInviteInput): Promise<InviteRecord>;
  listInvites(createdById: string): Promise<InviteRecord[]>;
  createAdminUser(input: CreateAdminUserInput): Promise<UserRecord>;
  completeOnboarding(user: UserRecord): Promise<UserRecord>;
  deleteAccount(user: UserRecord): Promise<void>;
}

export function createIdentityModule(prisma: PrismaClient): IdentityModule {
  const repos = createIdentityRepositories(prisma);
  const uow = createPrismaUnitOfWork(prisma);
  const hasher = createScryptPasswordHasher();
  const tokens = createCryptoTokenGenerator();
  const codes = createInviteCodeGenerator();
  const clock = createSystemClock();

  return {
    registerWithInvite: (input) => registerWithInvite({ uow, hasher, clock, tokens }, input),
    login: (input) =>
      login({ users: repos.users, sessions: repos.sessions, hasher, clock, tokens }, input),
    logout: (rawToken) => logout({ sessions: repos.sessions, tokens, clock }, rawToken),
    authenticate: (rawToken) =>
      authenticate({ users: repos.users, sessions: repos.sessions, tokens, clock }, rawToken),
    createInvite: (input) => createInvite({ invites: repos.invites, codes, clock }, input),
    listInvites: (createdById) => repos.invites.listByCreator(createdById),
    createAdminUser: (input) => createAdminUser({ users: repos.users, hasher }, input),
    completeOnboarding: (user) => completeOnboarding({ users: repos.users, clock }, user),
    deleteAccount: (user) => deleteAccount({ users: repos.users }, user),
  };
}
