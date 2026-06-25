import { beforeEach, describe, expect, it } from 'vitest';

import { createOnboardingSeen, type SeenStorage } from './onboardingSeen.js';

function fakeStorage(): SeenStorage {
  let value: string | null = null;
  return {
    read: () => value,
    write: (next) => {
      value = next;
    },
  };
}

describe('createOnboardingSeen', () => {
  let storage: SeenStorage;

  beforeEach(() => {
    storage = fakeStorage();
  });

  it('starts unseen', () => {
    expect(createOnboardingSeen(storage).hasSeen()).toBe(false);
  });

  it('persists the seen mark', () => {
    const seen = createOnboardingSeen(storage);
    seen.markSeen();
    expect(seen.hasSeen()).toBe(true);
    // Uma instância nova lê o mesmo armazenamento.
    expect(createOnboardingSeen(storage).hasSeen()).toBe(true);
  });

  it('treats unexpected values as unseen', () => {
    storage.write('whatever');
    expect(createOnboardingSeen(storage).hasSeen()).toBe(false);
  });
});
