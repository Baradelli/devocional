import type { AuthResult } from './authResult.js';
import { IdentityError } from './errors.js';
import { addDays, DEFAULT_SESSION_TTL_DAYS } from './internal.js';
import type {
  Clock,
  PasswordHasher,
  SessionRepository,
  TokenGenerator,
  UserRepository,
} from './ports.js';

export interface LoginDeps {
  users: UserRepository;
  sessions: SessionRepository;
  hasher: PasswordHasher;
  clock: Clock;
  tokens: TokenGenerator;
  sessionTtlDays?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(deps: LoginDeps, input: LoginInput): Promise<AuthResult> {
  const {
    users,
    sessions,
    hasher,
    clock,
    tokens,
    sessionTtlDays = DEFAULT_SESSION_TTL_DAYS,
  } = deps;

  const user = await users.findByEmail(input.email);
  if (!user) {
    throw new IdentityError('INVALID_CREDENTIALS');
  }

  const ok = await hasher.verify(input.password, user.passwordHash);
  if (!ok) {
    throw new IdentityError('INVALID_CREDENTIALS');
  }

  const now = clock.now();
  const rawToken = tokens.generate();
  const session = await sessions.create({
    tokenHash: tokens.hash(rawToken),
    userId: user.id,
    expiresAt: addDays(now, sessionTtlDays),
  });

  return { user, session, rawToken };
}
