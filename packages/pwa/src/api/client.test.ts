import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { apiRequest } from './client.js';

function mockFetch(body: unknown) {
  const fetchMock = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function headersOf(fetchMock: ReturnType<typeof vi.fn>): Headers {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
  return new Headers(init?.headers);
}

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('omits content-type when there is no request body', async () => {
    const fetchMock = mockFetch({ ok: true });

    await apiRequest('/notifications/test', z.object({ ok: z.boolean() }), { method: 'POST' });

    expect(headersOf(fetchMock).has('content-type')).toBe(false);
  });

  it('sends application/json content-type when a body is present', async () => {
    const fetchMock = mockFetch({ ok: true });

    await apiRequest('/notifications/push', z.object({ ok: z.boolean() }), {
      method: 'POST',
      body: JSON.stringify({ endpoint: 'https://example.com' }),
    });

    expect(headersOf(fetchMock).get('content-type')).toBe('application/json');
  });
});
