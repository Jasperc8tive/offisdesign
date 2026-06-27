import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Request-scoped context. Carries the per-request id, the authenticated
 * principal, and arbitrary tags. Stored via AsyncLocalStorage so any service
 * can read it without explicit dependency injection.
 */
export interface RequestContext {
  requestId: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  principal?:
    | {
        kind: 'admin' | 'customer';
        id: string;
        sessionId: string;
        roles?: string[];
        permissions?: string[];
      }
    | undefined;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

export function requireContext(): RequestContext {
  const ctx = storage.getStore();
  if (!ctx) throw new Error('No request context — middleware not wired or called outside request');
  return ctx;
}
