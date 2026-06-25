import { type CreateInviteRequest, type Invite, inviteSchema } from '@devocional/shared';
import { z } from 'zod';

import { apiRequest } from './client.js';

export function listInvites(): Promise<Invite[]> {
  return apiRequest('/admin/invites', z.array(inviteSchema));
}

export function createInvite(input: CreateInviteRequest): Promise<Invite> {
  return apiRequest('/admin/invites', inviteSchema, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function revokeInvite(id: string): Promise<Invite> {
  // Corpo vazio explícito: o client envia content-type application/json e o
  // Fastify recusa POST com esse content-type e corpo vazio.
  return apiRequest(`/admin/invites/${id}/revoke`, inviteSchema, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
