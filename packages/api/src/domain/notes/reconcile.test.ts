import { describe, expect, it } from 'vitest';

import { shouldApplyNoteOperation } from './reconcile.js';

const at = (iso: string) => new Date(iso);

describe('shouldApplyNoteOperation', () => {
  it('applies the first operation when no note exists yet', () => {
    expect(
      shouldApplyNoteOperation(null, { editedAt: at('2026-06-17T10:00:00Z'), idempotencyKey: 'a' }),
    ).toBe(true);
  });

  it('skips a replay of the same idempotencyKey (idempotent)', () => {
    const current = { editedAt: at('2026-06-17T10:00:00Z'), idempotencyKey: 'a' };
    expect(
      shouldApplyNoteOperation(current, {
        editedAt: at('2026-06-17T12:00:00Z'),
        idempotencyKey: 'a',
      }),
    ).toBe(false);
  });

  it('applies a newer edit (last-write-wins)', () => {
    const current = { editedAt: at('2026-06-17T10:00:00Z'), idempotencyKey: 'a' };
    expect(
      shouldApplyNoteOperation(current, {
        editedAt: at('2026-06-17T11:00:00Z'),
        idempotencyKey: 'b',
      }),
    ).toBe(true);
  });

  it('skips a stale edit older than the current note', () => {
    const current = { editedAt: at('2026-06-17T11:00:00Z'), idempotencyKey: 'b' };
    expect(
      shouldApplyNoteOperation(current, {
        editedAt: at('2026-06-17T10:00:00Z'),
        idempotencyKey: 'a',
      }),
    ).toBe(false);
  });

  it('skips an edit with the same instant (deterministic, treat as already-applied)', () => {
    const current = { editedAt: at('2026-06-17T10:00:00Z'), idempotencyKey: 'b' };
    expect(
      shouldApplyNoteOperation(current, {
        editedAt: at('2026-06-17T10:00:00Z'),
        idempotencyKey: 'a',
      }),
    ).toBe(false);
  });
});
