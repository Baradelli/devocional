import type { PasswordHasher, UserRecord, UserRepository } from './ports.js';

export interface CreateAdminUserDeps {
  users: UserRepository;
  hasher: PasswordHasher;
}

export interface CreateAdminUserInput {
  name: string;
  email: string;
  password: string;
  timezone: string;
}

/**
 * Bootstrap do primeiro admin (Vitor). Não passa por convite — é a porta de
 * entrada do sistema fechado, executada via script (ver scripts/createAdmin).
 */
export async function createAdminUser(
  deps: CreateAdminUserDeps,
  input: CreateAdminUserInput,
): Promise<UserRecord> {
  const passwordHash = await deps.hasher.hash(input.password);
  return deps.users.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: 'ADMIN',
    timezone: input.timezone,
  });
}
