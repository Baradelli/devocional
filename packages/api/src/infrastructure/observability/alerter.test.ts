import { describe, expect, it, vi } from 'vitest';

import { createLogAlerter } from './alerter.js';

function fakeLog() {
  return { warn: vi.fn(), error: vi.fn() };
}

describe('createLogAlerter', () => {
  it('emits a critical alert at error level with a routable `alert: true` field', () => {
    const log = fakeLog();
    const cause = new Error('boom');

    createLogAlerter(log).alert({
      event: 'REMINDER_JOB_FAILED',
      severity: 'critical',
      message: 'reminder dispatch job failed',
      context: { date: '2026-06-17' },
      cause,
    });

    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.warn).not.toHaveBeenCalled();
    const call = log.error.mock.calls[0] as [Record<string, unknown>, string];
    expect(call[0]).toMatchObject({
      alert: true,
      event: 'REMINDER_JOB_FAILED',
      severity: 'critical',
      date: '2026-06-17',
      err: cause,
    });
    expect(call[1]).toBe('reminder dispatch job failed');
  });

  it('emits a warning alert at warn level', () => {
    const log = fakeLog();

    createLogAlerter(log).alert({
      event: 'WHATSAPP_SEND_FAILED',
      severity: 'warning',
      message: 'whatsapp session unavailable',
    });

    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.error).not.toHaveBeenCalled();
    const call = log.warn.mock.calls[0] as [Record<string, unknown>, string];
    expect(call[0]).toMatchObject({
      alert: true,
      event: 'WHATSAPP_SEND_FAILED',
      severity: 'warning',
    });
  });
});
