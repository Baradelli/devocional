import { beforeEach, describe, expect, it } from 'vitest';

import { createNoteQueue } from './noteQueue.js';
import type { QueueStorage } from './queue.js';

function fakeStorage(): QueueStorage {
  let value: string | null = null;
  return {
    read: () => value,
    write: (next) => {
      value = next;
    },
  };
}

const op = (idempotencyKey: string, text: string, deleted = false) => ({
  devotionalId: 'dev-1',
  idempotencyKey,
  editedAt: '2026-06-17T10:00:00.000Z',
  text,
  deleted,
});

describe('createNoteQueue', () => {
  let storage: QueueStorage;

  beforeEach(() => {
    storage = fakeStorage();
  });

  it('starts empty', () => {
    expect(createNoteQueue(storage).list()).toEqual([]);
  });

  it('enqueues operations in order', () => {
    const queue = createNoteQueue(storage);
    queue.enqueue(op('a', 'um'));
    queue.enqueue(op('b', 'dois'));
    expect(queue.list().map((o) => o.idempotencyKey)).toEqual(['a', 'b']);
  });

  it('deduplicates by idempotencyKey', () => {
    const queue = createNoteQueue(storage);
    queue.enqueue(op('a', 'um'));
    queue.enqueue(op('a', 'editado'));
    expect(queue.list()).toHaveLength(1);
  });

  it('removes synced keys, keeping the rest', () => {
    const queue = createNoteQueue(storage);
    queue.enqueue(op('a', 'um'));
    queue.enqueue(op('b', 'dois'));
    queue.remove(['a']);
    expect(queue.list().map((o) => o.idempotencyKey)).toEqual(['b']);
  });

  it('recovers from corrupted storage as an empty queue', () => {
    storage.write('not json');
    const queue = createNoteQueue(storage);
    expect(queue.list()).toEqual([]);
    queue.enqueue(op('a', 'um'));
    expect(queue.list()).toHaveLength(1);
  });
});
