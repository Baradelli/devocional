import type { Clock, SessionRepository, TokenGenerator } from './ports.js';

export interface LogoutDeps {
  sessions: SessionRepository;
  tokens: TokenGenerator;
  clock: Clock;
}

/** Revoga a sessão do token informado. Idempotente: token inexistente é no-op. */
export async function logout(deps: LogoutDeps, rawToken: string): Promise<void> {
  const session = await deps.sessions.findByTokenHash(deps.tokens.hash(rawToken));
  if (session && !session.revokedAt) {
    await deps.sessions.revoke(session.id, deps.clock.now());
  }
}
