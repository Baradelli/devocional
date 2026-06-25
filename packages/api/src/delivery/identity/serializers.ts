import type { Invite, UserPublic } from '@devocional/shared';

import type { InviteRecord, UserRecord } from '../../application/identity/ports.js';

export function toUserPublic(user: UserRecord): UserPublic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    timezone: user.timezone,
    onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toInvitePublic(invite: InviteRecord, appUrl: string): Invite {
  return {
    id: invite.id,
    code: invite.code,
    email: invite.email,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString(),
    usedAt: invite.usedAt?.toISOString() ?? null,
    registerUrl: `${appUrl}/register?code=${invite.code}`,
    usedBy: invite.usedBy,
  };
}
