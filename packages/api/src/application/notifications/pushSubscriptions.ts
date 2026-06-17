import type { PushSubscriptionInput } from '@devocional/shared';

import type { PushSubscriptionRepository } from './ports.js';

export interface PushSubscriptionDeps {
  push: PushSubscriptionRepository;
}

export async function savePushSubscription(
  deps: PushSubscriptionDeps,
  userId: string,
  input: PushSubscriptionInput,
): Promise<void> {
  await deps.push.upsert({
    userId,
    endpoint: input.endpoint,
    p256dh: input.keys.p256dh,
    auth: input.keys.auth,
    label: input.label ?? null,
  });
}

export async function removePushSubscription(
  deps: PushSubscriptionDeps,
  userId: string,
  endpoint: string,
): Promise<void> {
  await deps.push.removeByEndpoint(userId, endpoint);
}
