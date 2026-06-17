import { describe, expect, it, vi } from 'vitest';

import type { Alerter } from '../observability/alerter.js';
import { createWhatsappChannel, type WhatsappTransport } from './whatsappChannel.js';

const PAYLOAD = { title: 'Seu devocional de hoje', body: 'Vamos juntos?', url: 'https://app' };
const TARGETS = { pushSubscriptions: [], whatsappPhone: '+5511999990000' };

function fakeAlerter(): Alerter & { calls: Parameters<Alerter['alert']>[0][] } {
  const calls: Parameters<Alerter['alert']>[0][] = [];
  return { calls, alert: (event) => calls.push(event) };
}

describe('createWhatsappChannel', () => {
  it('delivers via the transport and reports one delivery', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const transport: WhatsappTransport = { send };
    const alerter = fakeAlerter();

    const result = await createWhatsappChannel({ transport, alerter }).deliver(TARGETS, PAYLOAD);

    expect(result).toEqual({ delivered: 1 });
    expect(send).toHaveBeenCalledWith('+5511999990000', PAYLOAD.title);
    expect(alerter.calls).toHaveLength(0);
  });

  it('alerts WHATSAPP_SESSION_UNAVAILABLE when the session transport fails, never throwing', async () => {
    const transport: WhatsappTransport = {
      send: vi.fn().mockRejectedValue(new Error('session down')),
    };
    const alerter = fakeAlerter();

    const result = await createWhatsappChannel({ transport, alerter }).deliver(TARGETS, PAYLOAD);

    expect(result).toEqual({ delivered: 0 });
    expect(alerter.calls).toHaveLength(1);
    expect(alerter.calls[0]).toMatchObject({
      event: 'WHATSAPP_SESSION_UNAVAILABLE',
      severity: 'warning',
    });
  });

  it('is a no-op without a registered phone', async () => {
    const send = vi.fn();
    const transport: WhatsappTransport = { send };
    const alerter = fakeAlerter();

    const result = await createWhatsappChannel({ transport, alerter }).deliver(
      { pushSubscriptions: [], whatsappPhone: null },
      PAYLOAD,
    );

    expect(result).toEqual({ delivered: 0 });
    expect(send).not.toHaveBeenCalled();
  });
});
