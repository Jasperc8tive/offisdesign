import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { apiFetch } from './client';
import { ApiError } from './errors';

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('apiFetch', () => {
  it('parses successful JSON against the supplied schema', async () => {
    const schema = z.object({ ok: z.boolean(), n: z.number() });
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true, n: 7 }));
    const result = await apiFetch(schema, { path: '/x' });
    expect(result).toEqual({ ok: true, n: 7 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws ApiError on a 4xx with the envelope', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: { code: 'NOT_FOUND', message: 'gone' } }, 404),
    );
    await expect(apiFetch(z.unknown(), { path: '/x' })).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('refreshes the session once on a 401 and replays', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { code: 'UNAUTH', message: 'no' } }, 401))
      .mockResolvedValueOnce(new Response(null, { status: 204 })) // refresh
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const schema = z.object({ ok: z.boolean() });
    const result = await apiFetch(schema, { path: '/protected' });
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]![0]).toContain('/v1/auth/refresh');
  });

  it('throws on contract drift (schema mismatch)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ wrong: 'shape' }));
    const schema = z.object({ ok: z.boolean() });
    await expect(apiFetch(schema, { path: '/x' })).rejects.toThrow(/contract mismatch/);
  });

  it('builds the query string from arrays', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await apiFetch(z.array(z.unknown()), { path: '/list', query: { tag: ['oak', 'walnut'] } });
    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain('tag=oak');
    expect(url).toContain('tag=walnut');
  });

  it('ApiError.is recognises ApiError', () => {
    const err = new ApiError(404, { error: { code: 'NOT_FOUND', message: 'gone' } });
    expect(ApiError.is(err)).toBe(true);
    expect(ApiError.is(new Error('plain'))).toBe(false);
  });
});
