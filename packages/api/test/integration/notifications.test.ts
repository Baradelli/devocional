import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import type { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { dispatchReminders } from '../../src/application/notifications/dispatchReminders.js';
import type {
  ChannelTargets,
  NotificationChannel,
} from '../../src/application/notifications/ports.js';
import { sendTestNotification } from '../../src/application/notifications/sendTestNotification.js';
import { buildServer } from '../../src/delivery/server.js';
import type { Env } from '../../src/infrastructure/config/env.js';
import { createScryptPasswordHasher } from '../../src/infrastructure/identity/passwordHasher.js';
import {
  createNotificationRepositories,
  createNotificationTargetReader,
} from '../../src/infrastructure/notifications/prismaNotificationRepositories.js';
import { createPrismaClient } from '../../src/infrastructure/prisma/client.js';

const apiRoot = fileURLToPath(new URL('../../', import.meta.url));

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let app: FastifyInstance;
let env: Env;

const PASSWORD = 'member-supersecret';
// 2026-06-17T12:00:00Z = 09:00 em São Paulo → passou das 07:00 do lembrete.
const FIXED_NOW = new Date('2026-06-17T12:00:00Z');

interface RecordingChannel {
  channel: NotificationChannel;
  calls: ChannelTargets[];
}

function recordingChannel(key: NotificationChannel['key']): RecordingChannel {
  const calls: ChannelTargets[] = [];
  return {
    calls,
    channel: {
      key,
      deliver(targets) {
        calls.push(targets);
        const delivered =
          key === 'WEB_PUSH' ? targets.pushSubscriptions.length : targets.whatsappPhone ? 1 : 0;
        return Promise.resolve({ delivered });
      },
    },
  };
}

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const databaseUrl = container.getConnectionUri();
  execSync('pnpm exec prisma migrate deploy', {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  prisma = createPrismaClient(databaseUrl);
  await prisma.$connect();

  env = {
    NODE_ENV: 'test',
    DATABASE_URL: databaseUrl,
    PORT: 3000,
    COOKIE_NAME: 'devocional_session',
    MEDIA_DIR: 'media-storage-test',
    SERVER_TIMEZONE: 'America/Sao_Paulo',
    VAPID_SUBJECT: 'mailto:test@devocional.app',
    APP_URL: 'http://localhost:5173',
    CORS_ORIGINS: [],
  };
  app = buildServer({ prisma, env, logger: false });
  await app.ready();
});

afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
  await container?.stop();
});

async function createMember(email: string): Promise<string> {
  const passwordHash = await createScryptPasswordHasher().hash(PASSWORD);
  const user = await prisma.user.create({
    data: { name: 'Fiel', email, passwordHash, role: 'MEMBER', timezone: 'America/Sao_Paulo' },
  });
  return user.id;
}

async function loginAs(email: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password: PASSWORD },
  });
  expect(response.statusCode).toBe(200);
  const cookie = response.cookies.find((c) => c.name === env.COOKIE_NAME);
  if (!cookie) {
    throw new Error('Cookie de sessão ausente.');
  }
  return `${cookie.name}=${cookie.value}`;
}

const subscription = {
  endpoint: 'https://push.example.com/abc',
  keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
  label: 'iPhone',
};

describe('notifications: settings, push subscription and WhatsApp verification', () => {
  it('registers a device, saves a reminder, and verifies a WhatsApp number', async () => {
    await createMember('settings@devocional.test');
    const cookie = await loginAs('settings@devocional.test');

    const sub = await app.inject({
      method: 'POST',
      url: '/notifications/push',
      headers: { cookie },
      payload: subscription,
    });
    expect(sub.statusCode).toBe(200);

    const savePref = await app.inject({
      method: 'PUT',
      url: '/notifications/reminder',
      headers: { cookie },
      payload: { localTime: '07:00', pushEnabled: true, whatsappEnabled: true },
    });
    expect(savePref.statusCode).toBe(200);

    // Registra WhatsApp → fica pendente até validar.
    const register = await app.inject({
      method: 'POST',
      url: '/notifications/whatsapp',
      headers: { cookie },
      payload: { phone: '+5511999998888' },
    });
    expect(register.statusCode).toBe(200);

    const pending = await prisma.whatsappContact.findFirstOrThrow({
      where: { user: { email: 'settings@devocional.test' } },
    });
    expect(pending.status).toBe('PENDING');

    // Código errado é rejeitado.
    const wrong = await app.inject({
      method: 'POST',
      url: '/notifications/whatsapp/verify',
      headers: { cookie },
      payload: { code: '000000' },
    });
    expect(wrong.statusCode).toBe(400);

    // Código correto valida.
    const verify = await app.inject({
      method: 'POST',
      url: '/notifications/whatsapp/verify',
      headers: { cookie },
      payload: { code: pending.verificationCode },
    });
    expect(verify.statusCode).toBe(200);

    const settings = await app.inject({
      method: 'GET',
      url: '/notifications/settings',
      headers: { cookie },
    });
    const body = settings.json<{
      reminder: { localTime: string; pushEnabled: boolean; whatsappEnabled: boolean } | null;
      pushDevices: number;
      whatsapp: { status: string; phone: string | null };
    }>();
    expect(body.reminder?.localTime).toBe('07:00');
    expect(body.pushDevices).toBe(1);
    expect(body.whatsapp.status).toBe('VERIFIED');
    expect(body.whatsapp.phone).toBe('+5511999998888');
  });
});

describe('notifications: test notification (prova ponta a ponta do push)', () => {
  const TEST_PAYLOAD = { title: 'Tudo certo! 🌱', body: 'funcionando', url: '/' };

  it('delivers a test push to the user devices via Web Push only', async () => {
    const userId = await createMember('test-push@devocional.test');
    const cookie = await loginAs('test-push@devocional.test');

    await app.inject({
      method: 'POST',
      url: '/notifications/push',
      headers: { cookie },
      payload: { ...subscription, endpoint: 'https://push.example.com/test-push' },
    });

    const targets = createNotificationTargetReader(prisma);
    const push = recordingChannel('WEB_PUSH');
    const whatsapp = recordingChannel('WHATSAPP');

    const result = await sendTestNotification(
      { targets, channels: [push.channel, whatsapp.channel], payload: TEST_PAYLOAD },
      userId,
    );

    expect(result.delivered).toBe(1);
    expect(push.calls).toHaveLength(1);
    expect(push.calls[0]?.pushSubscriptions.length).toBe(1);
    // O teste é só de push: o canal WhatsApp nunca é acionado.
    expect(whatsapp.calls).toHaveLength(0);
  });

  it('delivers to zero devices when the user has no subscription', async () => {
    const userId = await createMember('test-push-empty@devocional.test');

    const targets = createNotificationTargetReader(prisma);
    const push = recordingChannel('WEB_PUSH');

    const result = await sendTestNotification(
      { targets, channels: [push.channel], payload: TEST_PAYLOAD },
      userId,
    );

    expect(result.delivered).toBe(0);
    expect(push.calls[0]?.pushSubscriptions.length).toBe(0);
  });

  it('exposes POST /notifications/test (no-op delivery without VAPID keys configured)', async () => {
    await createMember('test-route@devocional.test');
    const cookie = await loginAs('test-route@devocional.test');

    await app.inject({
      method: 'POST',
      url: '/notifications/push',
      headers: { cookie },
      payload: { ...subscription, endpoint: 'https://push.example.com/test-route' },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/notifications/test',
      headers: { cookie },
    });

    expect(response.statusCode).toBe(200);
    // Sem chaves VAPID no ambiente de teste, o canal Web Push é no-op → 0 entregue.
    expect(response.json<{ delivered: number }>().delivered).toBe(0);
  });

  it('rejects an unauthenticated test request', async () => {
    const response = await app.inject({ method: 'POST', url: '/notifications/test' });
    expect(response.statusCode).toBe(401);
  });
});

describe('notifications: reminder dispatch job (server-authoritative, deduped)', () => {
  it('delivers via active channels once the local time arrives, only once per day', async () => {
    await createMember('dispatch@devocional.test');
    const cookie = await loginAs('dispatch@devocional.test');

    // Isola o teste: só este usuário deve ser candidato ao disparo.
    await prisma.reminderPreference.deleteMany({});

    await app.inject({
      method: 'POST',
      url: '/notifications/push',
      headers: { cookie },
      payload: { ...subscription, endpoint: 'https://push.example.com/dispatch' },
    });
    await app.inject({
      method: 'PUT',
      url: '/notifications/reminder',
      headers: { cookie },
      payload: { localTime: '07:00', pushEnabled: true, whatsappEnabled: false },
    });

    const repos = createNotificationRepositories(prisma);
    const targets = createNotificationTargetReader(prisma);
    const push = recordingChannel('WEB_PUSH');
    const whatsapp = recordingChannel('WHATSAPP');
    const deps = {
      reminders: repos.reminders,
      targets,
      channels: [push.channel, whatsapp.channel],
      content: { build: () => ({ title: 't', body: 'b', url: 'u' }) },
      clock: { now: () => FIXED_NOW },
    };

    const first = await dispatchReminders(deps);
    expect(first.dispatched).toBe(1);
    expect(first.delivered).toBe(1);
    // Push ativo entrega ao device; WhatsApp inativo para este usuário não é chamado.
    expect(push.calls).toHaveLength(1);
    expect(push.calls[0]?.pushSubscriptions.length).toBe(1);
    expect(whatsapp.calls).toHaveLength(0);

    // Segundo disparo no mesmo dia: nada (dedup por dia).
    const second = await dispatchReminders(deps);
    const dispatchedUser = await prisma.reminderPreference.findUnique({
      where: {
        userId: (
          await prisma.user.findFirstOrThrow({ where: { email: 'dispatch@devocional.test' } })
        ).id,
      },
    });
    expect(dispatchedUser?.lastSentLogicalDate).toBe('2026-06-17');
    expect(second.dispatched).toBe(0);
    expect(push.calls).toHaveLength(1);
  });
});
