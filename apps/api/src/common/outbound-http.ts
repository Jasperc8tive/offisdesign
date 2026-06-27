/**
 * Outbound HTTP helpers for calls to third-party services (Stripe, mailer,
 * carriers, tax providers). Provides a single chokepoint where we enforce
 * timeouts, retries, and request-id propagation — rather than letting each
 * integration grow its own ad-hoc policy.
 *
 * Intentionally framework-free so it can be used inside services and tested
 * with plain Jest.
 */

export class OutboundError extends Error {
  override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'OutboundError';
    this.cause = cause;
  }
}

export class OutboundTimeoutError extends OutboundError {
  constructor(ms: number) {
    super(`Outbound call timed out after ${ms}ms`);
    this.name = 'OutboundTimeoutError';
  }
}

/**
 * Race a promise against a timeout. The underlying promise keeps running —
 * pass an AbortController to actually cancel the work when timing out.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new OutboundTimeoutError(ms)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export interface RetryOptions {
  /** Max attempts including the first try. */
  attempts: number;
  /** Initial backoff in ms; doubled each retry, capped at `maxDelayMs`. */
  delayMs: number;
  maxDelayMs?: number;
  /** Predicate: should this error be retried? Defaults to "yes". */
  shouldRetry?: (err: unknown) => boolean;
}

/**
 * Retry a callable with exponential backoff. Defaults to 3 attempts and
 * jitter-free 200 ms → 400 ms → 800 ms.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: Partial<RetryOptions> = {},
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const initialDelay = opts.delayMs ?? 200;
  const maxDelayMs = opts.maxDelayMs ?? 2000;
  const shouldRetry = opts.shouldRetry ?? ((): boolean => true);
  let lastError: unknown;
  let delay = initialDelay;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === attempts || !shouldRetry(err)) break;
      await new Promise((r) => setTimeout(r, Math.min(delay, maxDelayMs)));
      delay *= 2;
    }
  }
  throw lastError;
}

/**
 * Convenience wrapper: `fetch` with a hard timeout. Returns the raw `Response`
 * so callers can inspect status before assuming success.
 */
export async function fetchWithTimeout(
  url: string | URL,
  init: RequestInit & { timeoutMs?: number; requestId?: string } = {},
): Promise<Response> {
  const controller = new AbortController();
  const { timeoutMs = 8000, requestId, headers, ...rest } = init;
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const mergedHeaders = new Headers(headers);
  if (requestId && !mergedHeaders.has('x-request-id')) {
    mergedHeaders.set('x-request-id', requestId);
  }
  try {
    return await fetch(url, { ...rest, headers: mergedHeaders, signal: controller.signal });
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') {
      throw new OutboundTimeoutError(timeoutMs);
    }
    throw new OutboundError(`Outbound fetch to ${String(url)} failed`, err);
  } finally {
    clearTimeout(t);
  }
}
