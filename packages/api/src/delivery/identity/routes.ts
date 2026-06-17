import {
  createInviteRequestSchema,
  inviteSchema,
  loginRequestSchema,
  registerRequestSchema,
  userPublicSchema,
} from '@devocional/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import type { Env } from '../../infrastructure/config/env.js';
import type { IdentityModule } from '../../infrastructure/identity/identityModule.js';
import { clearSessionCookie, setSessionCookie } from './cookies.js';
import { requireAdmin, requireAuth } from './guards.js';
import { toInvitePublic, toUserPublic } from './serializers.js';

export interface IdentityRoutesOptions {
  identity: IdentityModule;
  env: Env;
}

export const identityRoutes: FastifyPluginAsync<IdentityRoutesOptions> = (app, opts) => {
  const { identity, env } = opts;

  // O contexto de autenticação (decorateRequest + onRequest) é montado no root
  // do servidor (server.ts), compartilhado entre os módulos de rotas.
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    '/auth/register',
    { schema: { body: registerRequestSchema, response: { 201: userPublicSchema } } },
    async (request, reply) => {
      const result = await identity.registerWithInvite(request.body);
      setSessionCookie(reply, env, result.rawToken, result.session.expiresAt);
      return reply.status(201).send(toUserPublic(result.user));
    },
  );

  r.post(
    '/auth/login',
    { schema: { body: loginRequestSchema, response: { 200: userPublicSchema } } },
    async (request, reply) => {
      const result = await identity.login(request.body);
      setSessionCookie(reply, env, result.rawToken, result.session.expiresAt);
      return toUserPublic(result.user);
    },
  );

  r.post('/auth/logout', async (request, reply) => {
    const token = request.cookies[env.COOKIE_NAME];
    if (token) {
      await identity.logout(token);
    }
    clearSessionCookie(reply, env);
    return reply.status(204).send();
  });

  r.get(
    '/auth/me',
    { preHandler: requireAuth, schema: { response: { 200: userPublicSchema } } },
    (request) => toUserPublic(request.currentUser!),
  );

  r.post(
    '/auth/onboarding/complete',
    { preHandler: requireAuth, schema: { response: { 200: userPublicSchema } } },
    async (request) => toUserPublic(await identity.completeOnboarding(request.currentUser!)),
  );

  r.post(
    '/admin/invites',
    {
      preHandler: requireAdmin,
      schema: { body: createInviteRequestSchema, response: { 201: inviteSchema } },
    },
    async (request, reply) => {
      const invite = await identity.createInvite({
        createdById: request.currentUser!.id,
        email: request.body.email ?? null,
        expiresInDays: request.body.expiresInDays,
      });
      return reply.status(201).send(toInvitePublic(invite));
    },
  );

  r.get(
    '/admin/invites',
    { preHandler: requireAdmin, schema: { response: { 200: z.array(inviteSchema) } } },
    async (request) => {
      const invites = await identity.listInvites(request.currentUser!.id);
      return invites.map(toInvitePublic);
    },
  );

  return Promise.resolve();
};
