import type { z } from 'zod';
import { apiConfig } from './config';
import { ApiError, NetworkError, type ApiErrorBody } from './errors';

export interface RequestOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined | null | string[]>;
  body?: TBody;
  signal?: AbortSignal | undefined;
  idempotencyKey?: string | undefined;
  skipAuthRefresh?: boolean;
  requestId?: string;
}

let refreshPromise: Promise<void> | null = null;

async function refreshSession(): Promise<void> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      await request({ method: 'POST', path: '/v1/auth/refresh', skipAuthRefresh: true });
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

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function request<T = unknown>(opts: RequestOptions): Promise<T> {
  const url = buildUrl(opts.path, opts.query);
  const headers: Record<string, string> = {
    'x-request-id': opts.requestId ?? newRequestId(),
  };
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.idempotencyKey) headers['idempotency-key'] = opts.idempotencyKey;

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
      /* fall through */
    }
    return request<T>({ ...opts, skipAuthRefresh: true });
  }

  const text = await res.text();
  const json = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (json as ApiErrorBody) ?? { error: { code: 'UNKNOWN', message: `HTTP ${res.status}` } },
    );
  }
  return json as T;
}

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

export async function apiRequest(opts: RequestOptions): Promise<void> {
  await request<unknown>(opts);
}
