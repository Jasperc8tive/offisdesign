import type { z } from 'zod';
import { apiConfig } from './config';
import { ApiError, NetworkError, type ApiErrorBody } from './errors';

export interface RequestOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined | null | string[]>;
  body?: TBody;
  /** Pass-through abort signal. */
  signal?: AbortSignal | undefined;
  /** Idempotency-Key header for write-once endpoints. */
  idempotencyKey?: string | undefined;
  /** Skip 401 → refresh-and-retry; used by the refresh call itself. */
  skipAuthRefresh?: boolean;
  /** Optional explicit request id (otherwise generated). Propagated to the API. */
  requestId?: string;
}

let refreshPromise: Promise<void> | null = null;

/**
 * Single-flight refresh: concurrent 401s share one refresh round-trip.
 * The refresh endpoint sends a new access cookie; on success we replay the
 * original request once. Refresh failure surfaces as 401 to the caller.
 */
async function refreshSession(): Promise<void> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      await request({
        method: 'POST',
        path: '/v1/auth/refresh',
        skipAuthRefresh: true,
      });
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path, apiConfig.baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, String(v));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * Low-level request — performs the fetch, parses error envelopes, and applies
 * the refresh-and-retry logic. Callers usually go through `apiFetch` (typed
 * with a Zod schema) or the higher-level service modules.
 */
/**
 * Generate a short request id we send up to the API as `x-request-id`. The
 * server will reuse the id we send if present, otherwise mint its own —
 * either way it ends up in structured logs on both sides, which is what
 * makes cross-system tracing possible.
 */
function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function request<T = unknown>(opts: RequestOptions): Promise<T> {
  const url = buildUrl(opts.path, opts.query);
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.idempotencyKey) headers['idempotency-key'] = opts.idempotencyKey;
  headers['x-request-id'] = opts.requestId ?? newRequestId();

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      credentials: 'include',
      ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
      ...(opts.signal ? { signal: opts.signal } : {}),
    });
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') throw err;
    throw new NetworkError(err);
  }

  if (res.status === 204) return undefined as T;

  if (res.status === 401 && !opts.skipAuthRefresh) {
    try {
      await refreshSession();
    } catch {
      // Refresh failed; original 401 stands.
    }
    return request<T>({ ...opts, skipAuthRefresh: true });
  }

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (json as ApiErrorBody) ?? {
        error: { code: 'UNKNOWN', message: `HTTP ${res.status}` },
      },
    );
  }
  return json as T;
}

/**
 * Typed request: validates the response with a Zod schema. Schema failures
 * surface as a thrown `Error` — the API contract has drifted.
 */
export async function apiFetch<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  opts: RequestOptions,
): Promise<z.infer<TSchema>> {
  const raw = await request<unknown>(opts);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `API contract mismatch at ${opts.path}: ${parsed.error.issues
        .map((i) => `${i.path.join('.')} ${i.message}`)
        .join('; ')}`,
    );
  }
  return parsed.data;
}

/** Unvalidated raw request — only for endpoints with no response body. */
export async function apiRequest(opts: RequestOptions): Promise<void> {
  await request<unknown>(opts);
}
