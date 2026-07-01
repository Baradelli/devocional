import { describe, expect, it } from 'vitest';

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

const op = (devotionalId: string, idempotencyKey: string, text: string, deleted = false) => ({
  devotionalId,
  idempotencyKey,
  editedAt: '2026-06-17T10:00:00.000Z',
  text,
  deleted,
});

describe('noteQueue.upsertByDevotional', () => {
  it('keeps a single pending operation per devotional, replacing in place', () => {
    const queue = createNoteQueue(fakeStorage());
    queue.upsertByDevotional(op('dev-1', 'a', 'rascunho'));
    queue.upsertByDevotional(op('dev-1', 'b', 'editado'));
    const items = queue.list();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ devotionalId: 'dev-1', idempotencyKey: 'b', text: 'editado' });
  });

  it('coalesces independently per devotional and preserves order', () => {
    const queue = createNoteQueue(fakeStorage());
    queue.upsertByDevotional(op('dev-1', 'a', 'um'));
    queue.upsertByDevotional(op('dev-2', 'b', 'dois'));
    queue.upsertByDevotional(op('dev-1', 'c', 'um-editado'));
    expect(queue.list().map((o) => [o.devotionalId, o.idempotencyKey])).toEqual([
      ['dev-1', 'c'],
      ['dev-2', 'b'],
    ]);
  });

  it('carries a deletion as the coalesced operation', () => {
    const queue = createNoteQueue(fakeStorage());
    queue.upsertByDevotional(op('dev-1', 'a', 'texto'));
    queue.upsertByDevotional(op('dev-1', 'b', '', true));
    const items = queue.list();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ idempotencyKey: 'b', text: '', deleted: true });
  });

  it('does not change enqueue dedupe behaviour', () => {
    const queue = createNoteQueue(fakeStorage());
    queue.enqueue(op('dev-1', 'a', 'um'));
    queue.enqueue(op('dev-1', 'a', 'again'));
    expect(queue.list()).toHaveLength(1);
  });
});
