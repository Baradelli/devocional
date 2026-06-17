import type { Clock, UserRecord, UserRepository } from './ports.js';

export interface CompleteOnboardingDeps {
  users: UserRepository;
  clock: Clock;
}

/**
 * Marca o onboarding como concluído (uma vez). Idempotente: rever o tour depois
 * não reescreve o `onboardingCompletedAt` original.
 */
export async function completeOnboarding(
  deps: CompleteOnboardingDeps,
  user: UserRecord,
): Promise<UserRecord> {
  if (user.onboardingCompletedAt) {
    return user;
  }
  return deps.users.markOnboardingCompleted(user.id, deps.clock.now());
}
