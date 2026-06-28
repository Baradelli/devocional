import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createNoteQueue } from '../../offline/noteQueue.js';
import type { QueueStorage } from '../../offline/queue.js';
import { createAutosaveController, type SaveStatus } from './autosaveController.js';

function fakeStorage(): QueueStorage {
  let value: string | null = null;
  return {
    read: () => value,
    write: (next) => {
      value = next;
    },
  };
}

function setup(
  opts: {
    existedOnLoad?: boolean;
    initialMarkdown?: string;
    flushImpl?: () => Promise<unknown>;
  } = {},
) {
  const queue = createNoteQueue(fakeStorage());
  const statuses: SaveStatus[] = [];
  let counter = 0;
  const flush = vi.fn(opts.flushImpl ?? (() => Promise.resolve(null)));
  const controller = createAutosaveController({
    devotionalId: 'dev-1',
    existedOnLoad: opts.existedOnLoad ?? false,
    initialMarkdown: opts.initialMarkdown ?? '',
    queue,
    flush,
    now: () => '2026-06-27T12:00:00.000Z',
    newId: () => `key-${++counter}`,
    onStatus: (s) => statuses.push(s),
    debounceMs: 1000,
    maxWaitMs: 5000,
  });
  return { queue, statuses, flush, controller };
}

describe('autosaveController', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('commits one coalesced operation after the debounce window', async () => {
    const { queue, flush, controller } = setup();
    controller.change('# Olá');
    expect(queue.list()).toHaveLength(0); // ainda no debounce
    await vi.advanceTimersByTimeAsync(1000);
    const items = queue.list();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ devotionalId: 'dev-1', text: '# Olá', deleted: false });
    expect(flush).toHaveBeenCalledOnce();
  });

  it('coalesces rapid edits into a single operation', async () => {
    const { queue, controller } = setup();
    controller.change('a');
    await vi.advanceTimersByTimeAsync(300);
    controller.change('ab');
    await vi.advanceTimersByTimeAsync(300);
    controller.change('abc');
    await vi.advanceTimersByTimeAsync(1000);
    const items = queue.list();
    expect(items).toHaveLength(1);
    expect(items[0]?.text).toBe('abc');
  });

  it('reports saving then saved', async () => {
    const { statuses, controller } = setup();
    controller.change('oi');
    expect(statuses).toContain('saving');
    await vi.advanceTimersByTimeAsync(1000);
    expect(statuses.at(-1)).toBe('saved');
  });

  it('marks offline when the flush rejects but keeps the local op', async () => {
    const { queue, statuses, controller } = setup({
      flushImpl: () => Promise.reject(new Error('net')),
    });
    controller.change('oi');
    await vi.advanceTimersByTimeAsync(1000);
    expect(queue.list()).toHaveLength(1);
    expect(statuses.at(-1)).toBe('offline');
  });

  it('flushNow commits immediately, bypassing the debounce', async () => {
    const { queue, flush, controller } = setup();
    controller.change('rápido');
    controller.flushNow();
    expect(queue.list()).toHaveLength(1);
    expect(queue.list()[0]?.text).toBe('rápido');
    await Promise.resolve();
    expect(flush).toHaveBeenCalled();
  });

  it('does not materialise an empty note that never existed', async () => {
    const { queue, flush, controller } = setup({ existedOnLoad: false });
    controller.change('   ');
    await vi.advanceTimersByTimeAsync(1000);
    expect(queue.list()).toHaveLength(0);
    expect(flush).not.toHaveBeenCalled();
  });

  it('soft-deletes an existing note that was emptied', async () => {
    const { queue, controller } = setup({ existedOnLoad: true, initialMarkdown: '# tinha algo' });
    controller.change('');
    await vi.advanceTimersByTimeAsync(1000);
    const items = queue.list();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ deleted: true, text: '' });
  });

  it('does not re-commit unchanged content', async () => {
    const { queue, flush, controller } = setup({ initialMarkdown: 'igual' });
    controller.change('igual');
    await vi.advanceTimersByTimeAsync(1000);
    expect(queue.list()).toHaveLength(0);
    expect(flush).not.toHaveBeenCalled();
  });

  it('remove() enqueues a soft-deletion for an existing note', () => {
    const { queue, controller } = setup({ existedOnLoad: true, initialMarkdown: '# algo' });
    controller.remove();
    const items = queue.list();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ deleted: true, text: '' });
  });

  it('remove() enqueues nothing for a note that never existed', () => {
    const { queue, controller } = setup({ existedOnLoad: false, initialMarkdown: '' });
    controller.remove();
    expect(queue.list()).toHaveLength(0);
  });

  it('ignores edits and flushes after remove() (no resurrection)', async () => {
    const { queue, controller } = setup({ existedOnLoad: true, initialMarkdown: '# algo' });
    controller.remove();
    controller.change('voltei');
    controller.flushNow();
    await vi.advanceTimersByTimeAsync(2000);
    const items = queue.list();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ deleted: true });
  });

  it('forces a commit at the max-wait even while still typing', async () => {
    const { queue, controller } = setup();
    for (let i = 0; i < 10; i++) {
      controller.change(`texto ${i}`);
      await vi.advanceTimersByTimeAsync(600); // nunca deixa o debounce de 1000 fechar
    }
    expect(queue.list()).toHaveLength(1); // max-wait (5000) forçou um commit
  });
});
