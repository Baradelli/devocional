import { type UserPublic, userPublicSchema } from '@devocional/shared';

import { apiRequest } from './client.js';

/** Marca o onboarding como concluído e devolve o usuário atualizado. */
export function completeOnboarding(): Promise<UserPublic> {
  return apiRequest('/auth/onboarding/complete', userPublicSchema, { method: 'POST' });
}
