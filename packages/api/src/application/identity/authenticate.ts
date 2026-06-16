import type {
  Clock,
  SessionRepository,
  TokenGenerator,
  UserRecord,
  UserRepository,
} from './ports.js';

export interface AuthenticateDeps {
  users: UserRepository;
  sessions: SessionRepository;
  tokens: TokenGenerator;
  clock: Clock;
}

/**
 * Resolve o usuário atual a partir do token de sessão (cookie). Retorna `null`
 * se a sessão não existe, foi revogada ou expirou — a autoridade é do servidor.
 */
export async function authenticate(
  deps: AuthenticateDeps,
  rawToken: string,
): Promise<UserRecord | null> {
  const session = await deps.sessions.findByTokenHash(deps.tokens.hash(rawToken));
  if (!session || session.revokedAt) {
    return null;
  }
  if (session.expiresAt.getTime() <= deps.clock.now().getTime()) {
    return null;
  }
  return deps.users.findById(session.userId);
}
