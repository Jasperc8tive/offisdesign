/**
 * Vendor-neutral error reporting interface. The storefront imports
 * `reportError` and `setUser`; the runtime decides whether to plug in
 * Sentry/Datadog/OpenTelemetry later by calling `installErrorReporter()`
 * with a different sink.
 *
 * Default sink is `console.error` so problems are still surfaced in dev.
 */

import { ApiError } from '../api/errors';

export interface ErrorContext {
  /** Free-form tags. Strings only — keep payload safe to ship to vendors. */
  tags?: Record<string, string>;
  /** Larger structured context (route, props excerpt, etc.). */
  extra?: Record<string, unknown>;
  /** Optional propagated request id from the API. */
  requestId?: string;
}

export interface ErrorReporter {
  reportError(error: unknown, context?: ErrorContext): void;
  reportMessage(message: string, context?: ErrorContext): void;
  setUser(user: { id: string; email?: string } | null): void;
}

const consoleReporter: ErrorReporter = {
  reportError(error, context) {
    const requestId = context?.requestId ?? (ApiError.is(error) ? error.requestId : undefined);
    console.error('[error-report]', { error, requestId, ...context });
  },
  reportMessage(message, context) {
    console.warn('[error-report]', message, context);
  },
  setUser() {
    /* no-op */
  },
};

let active: ErrorReporter = consoleReporter;

/**
 * Replace the active reporter — call once at boot inside a `'use client'`
 * provider. Vendors (Sentry, etc.) wrap their SDK behind this contract so the
 * rest of the codebase stays neutral.
 */
export function installErrorReporter(reporter: ErrorReporter): void {
  active = reporter;
}

export function reportError(error: unknown, context?: ErrorContext): void {
  try {
    active.reportError(error, context);
  } catch {
    // The reporter itself failed — fall through silently. We never want
    // telemetry to crash the app.
  }
}

export function reportMessage(message: string, context?: ErrorContext): void {
  try {
    active.reportMessage(message, context);
  } catch {
    /* swallow */
  }
}

export function setUser(user: { id: string; email?: string } | null): void {
  try {
    active.setUser(user);
  } catch {
    /* swallow */
  }
}

/** Test helper. Not intended for production use. */
export function __resetErrorReporterForTests(): void {
  active = consoleReporter;
}
