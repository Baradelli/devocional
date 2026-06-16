import type { FastifyReply } from 'fastify';

import type { Env } from '../../infrastructure/config/env.js';

export function setSessionCookie(
  reply: FastifyReply,
  env: Env,
  rawToken: string,
  expiresAt: Date,
): void {
  reply.setCookie(env.COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(reply: FastifyReply, env: Env): void {
  reply.clearCookie(env.COOKIE_NAME, { path: '/' });
}
