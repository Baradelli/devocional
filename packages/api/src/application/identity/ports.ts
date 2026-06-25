import type { Role } from '@devocional/shared';

import type { InviteStatus } from '../../domain/identity/invite.js';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  timezone: string;
  onboardingCompletedAt: Date | null;
  createdAt: Date;
}

export interface InviteRecord {
  id: string;
  code: string;
  email: string | null;
  status: InviteStatus;
  expiresAt: Date;
  createdById: string;
  usedById: string | null;
  usedAt: Date | null;
  createdAt: Date;
  /** Quem resgatou o convite (preenchido só quando USED). */
  usedBy: { name: string; email: string } | null;
}

export interface SessionRecord {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  timezone: string;
}

export interface CreateInviteInput {
  code: string;
  email: string | null;
  expiresAt: Date;
  createdById: string;
}

export interface CreateSessionInput {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}

export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(input: CreateUserInput): Promise<UserRecord>;
  markOnboardingCompleted(id: string, at: Date): Promise<UserRecord>;
  /** Apaga o usuário e, por cascata, todos os dados de sua propriedade (LGPD). */
  delete(id: string): Promise<void>;
}

export interface InviteRepository {
  findById(id: string): Promise<InviteRecord | null>;
  findByCode(code: string): Promise<InviteRecord | null>;
  create(input: CreateInviteInput): Promise<InviteRecord>;
  markUsed(id: string, usedById: string, usedAt: Date): Promise<void>;
  revoke(id: string): Promise<InviteRecord>;
  listByCreator(createdById: string): Promise<InviteRecord[]>;
}

export interface SessionRepository {
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  create(input: CreateSessionInput): Promise<SessionRecord>;
  revoke(id: string, revokedAt: Date): Promise<void>;
}

export interface IdentityRepositories {
  users: UserRepository;
  invites: InviteRepository;
  sessions: SessionRepository;
}

/** Unit of Work: executa um trabalho atômico (transação) sobre os repositórios. */
export interface UnitOfWork {
  run<T>(work: (repos: IdentityRepositories) => Promise<T>): Promise<T>;
}

export interface Clock {
  now(): Date;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

/** Gera o token de sessão (raw) e o hash determinístico para armazenar/consultar. */
export interface TokenGenerator {
  generate(): string;
  hash(token: string): string;
}

/** Gera códigos de convite (compartilháveis pelo admin). */
export interface InviteCodeGenerator {
  generate(): string;
}
