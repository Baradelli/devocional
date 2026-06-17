import { type LoginRequest, type UserPublic, userPublicSchema } from '@devocional/shared';

import { API_BASE, apiRequest } from './client.js';

export function login(credentials: LoginRequest): Promise<UserPublic> {
  return apiRequest('/auth/login', userPublicSchema, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function fetchCurrentUser(): Promise<UserPublic> {
  return apiRequest('/auth/me', userPublicSchema);
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
}

/** Exclusão de conta + dados (LGPD). O servidor apaga tudo e limpa a sessão. */
export async function deleteAccount(): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('delete-account-failed');
  }
}
