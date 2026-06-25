import { evaluateInvite, inviteAllowsEmail } from '../../domain/identity/invite.js';
import type { AuthResult } from './authResult.js';
import { IdentityError } from './errors.js';
import { addDays, DEFAULT_SESSION_TTL_DAYS, inviteErrorCode } from './internal.js';
import type { Clock, PasswordHasher, TokenGenerator, UnitOfWork } from './ports.js';

export interface RegisterWithInviteDeps {
  uow: UnitOfWork;
  hasher: PasswordHasher;
  clock: Clock;
  tokens: TokenGenerator;
  sessionTtlDays?: number;
}

export interface RegisterWithInviteInput {
  inviteCode: string;
  name: string;
  email: string;
  password: string;
  timezone: string;
}

/**
 * Cadastro só com convite válido. Valida o convite (regra de domínio pura),
 * cria o usuário, consome o convite e abre a sessão — tudo numa transação.
 */
export async function registerWithInvite(
  deps: RegisterWithInviteDeps,
  input: RegisterWithInviteInput,
): Promise<AuthResult> {
  const { uow, hasher, clock, tokens, sessionTtlDays = DEFAULT_SESSION_TTL_DAYS } = deps;

  // Hash fora da transação para não segurar o lock durante o trabalho custoso.
  const passwordHash = await hasher.hash(input.password);
  const now = clock.now();

  return uow.run(async ({ users, invites, sessions }) => {
    const invite = await invites.findByCode(input.inviteCode);
    if (!invite) {
      throw new IdentityError('INVITE_NOT_FOUND');
    }

    const evaluation = evaluateInvite(invite, now);
    if (evaluation !== 'USABLE') {
      throw new IdentityError(inviteErrorCode(evaluation));
    }

    // Convite emitido para um e-mail específico só aceita aquele e-mail.
    if (!inviteAllowsEmail(invite.email, input.email)) {
      throw new IdentityError('INVITE_EMAIL_MISMATCH');
    }

    if (await users.findByEmail(input.email)) {
      throw new IdentityError('EMAIL_TAKEN');
    }

    const user = await users.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'MEMBER',
      timezone: input.timezone,
    });

    await invites.markUsed(invite.id, user.id, now);

    const rawToken = tokens.generate();
    const session = await sessions.create({
      tokenHash: tokens.hash(rawToken),
      userId: user.id,
      expiresAt: addDays(now, sessionTtlDays),
    });

    return { user, session, rawToken };
  });
}
