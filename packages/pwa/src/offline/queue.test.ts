import { beforeEach, describe, expect, it } from 'vitest';

import { createCompletionQueue, type QueueStorage } from './queue.js';

function fakeStorage(): QueueStorage {
  let value: string | null = null;
  return {
    read: () => value,
    write: (next) => {
      value = next;
    },
  };
}

describe('createCompletionQueue', () => {
  let storage: QueueStorage;

  beforeEach(() => {
    storage = fakeStorage();
  });

  it('starts empty', () => {
    expect(createCompletionQueue(storage).list()).toEqual([]);
  });

  it('enqueues and lists completions', () => {
    const queue = createCompletionQueue(storage);
    queue.enqueue({ idempotencyKey: 'a', completedAt: '2026-06-16T12:00:00.000Z' });
    queue.enqueue({ idempotencyKey: 'b', completedAt: '2026-06-17T12:00:00.000Z' });
    expect(queue.list().map((c) => c.idempotencyKey)).toEqual(['a', 'b']);
  });

  it('deduplicates by idempotencyKey', () => {
    const queue = createCompletionQueue(storage);
    queue.enqueue({ idempotencyKey: 'a', completedAt: '2026-06-16T12:00:00.000Z' });
    queue.enqueue({ idempotencyKey: 'a', completedAt: '2026-06-16T18:00:00.000Z' });
    expect(queue.list()).toHaveLength(1);
  });

  it('removes synced keys, keeping the rest', () => {
    const queue = createCompletionQueue(storage);
    queue.enqueue({ idempotencyKey: 'a', completedAt: '2026-06-16T12:00:00.000Z' });
    queue.enqueue({ idempotencyKey: 'b', completedAt: '2026-06-17T12:00:00.000Z' });
    queue.remove(['a']);
    expect(queue.list().map((c) => c.idempotencyKey)).toEqual(['b']);
  });

  it('recovers from corrupted storage as an empty queue', () => {
    storage.write('not json');
    const queue = createCompletionQueue(storage);
    expect(queue.list()).toEqual([]);
    queue.enqueue({ idempotencyKey: 'a', completedAt: '2026-06-16T12:00:00.000Z' });
    expect(queue.list()).toHaveLength(1);
  });
});
