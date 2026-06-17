import { IdentityError } from './errors.js';
import type { UserRecord, UserRepository } from './ports.js';

export interface DeleteAccountDeps {
  users: Pick<UserRepository, 'delete'>;
}

/**
 * Exclusão de conta + dados (LGPD). Remove o usuário; sessões, conclusões,
 * streak, conquistas, anotações, inscrições push, contato e preferência de
 * WhatsApp/lembrete saem por cascata (FKs `onDelete: Cascade`). O admin único
 * (autor do conteúdo) não pode se autoexcluir por aqui — evita órfãos e lockout.
 */
export async function deleteAccount(deps: DeleteAccountDeps, user: UserRecord): Promise<void> {
  if (user.role === 'ADMIN') {
    throw new IdentityError('CANNOT_DELETE_ADMIN');
  }
  await deps.users.delete(user.id);
}
