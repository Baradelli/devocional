import { canRevokeInvite } from '../../domain/identity/invite.js';
import { IdentityError } from './errors.js';
import type { InviteRecord, InviteRepository } from './ports.js';

export interface RevokeInviteDeps {
  invites: InviteRepository;
}

/**
 * Admin cancela um convite. Só convites ainda pendentes podem ser revogados;
 * usados (já viraram conta) e já revogados são intocáveis. Mantém a linha para
 * auditoria (status → REVOKED), nunca apaga.
 */
export async function revokeInvite(
  deps: RevokeInviteDeps,
  inviteId: string,
): Promise<InviteRecord> {
  const invite = await deps.invites.findById(inviteId);
  if (!invite) {
    throw new IdentityError('INVITE_NOT_FOUND');
  }
  if (!canRevokeInvite(invite.status)) {
    throw new IdentityError(invite.status === 'USED' ? 'INVITE_ALREADY_USED' : 'INVITE_REVOKED');
  }
  return deps.invites.revoke(invite.id);
}
