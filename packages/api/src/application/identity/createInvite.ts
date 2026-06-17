import { addDays } from './internal.js';
import type { Clock, InviteCodeGenerator, InviteRecord, InviteRepository } from './ports.js';

export interface CreateInviteDeps {
  invites: InviteRepository;
  codes: InviteCodeGenerator;
  clock: Clock;
}

export interface CreateInviteInput {
  createdById: string;
  email: string | null;
  expiresInDays: number;
}

/** Admin gera um convite. O código é compartilhado fora da app (não há e-mail no v1). */
export async function createInvite(
  deps: CreateInviteDeps,
  input: CreateInviteInput,
): Promise<InviteRecord> {
  const now = deps.clock.now();
  return deps.invites.create({
    code: deps.codes.generate(),
    email: input.email,
    expiresAt: addDays(now, input.expiresInDays),
    createdById: input.createdById,
  });
}
