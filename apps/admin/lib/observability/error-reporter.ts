/**
 * Vendor-neutral error reporting hook for the admin app.
 *
 * Today: structured console.error so errors show up in browser devtools and
 * in any log shipper attached to stdout in SSR. Swap the body for Sentry /
 * Datadog / Bugsnag when the SDK is wired — call sites do not need to change.
 */

export interface ReportErrorOptions {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export function reportError(error: unknown, options: ReportErrorOptions = {}): void {
  const payload = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    tags: { surface: 'admin', ...options.tags },
    extra: options.extra,
  };
  console.error('[admin:error]', payload);
}
