# Observability

The platform emits structured logs, propagates a single correlation id across the storefront → API hop, surfaces errors through a vendor-neutral channel, and is wired so a Sentry/Datadog/OpenTelemetry integration can be plugged in without touching feature code.

## Correlation id

A single `x-request-id` follows each request end-to-end.

- **Storefront client** (`apps/web/lib/api/client.ts`): every `fetch` call sends `x-request-id` — either explicitly passed via `RequestOptions.requestId` or auto-generated via `crypto.randomUUID()`.
- **API middleware** (`apps/api/src/common/request-id.middleware.ts`): reads the inbound header if present, otherwise mints a UUIDv7. Stored in `AsyncLocalStorage` for the lifetime of the request.
- **API responses** echo the id back via header `x-request-id` and embed it in the JSON error envelope (`{ error, requestId }`). The storefront's `ApiError` exposes `error.requestId` so it can be reported alongside the failure.

## Structured logging (API)

- `nestjs-pino` with redaction for `authorization`, `cookie`, `passwordHash` (`apps/api/src/logger/logger.module.ts`).
- Every log line carries the `requestId` from the AsyncLocalStorage context.
- `HttpExceptionFilter` (`apps/api/src/common/http-exception.filter.ts`) logs the stack server-side but emits only `{ code, message }` in the response — no stack traces leak to clients.

## Client error reporting

`apps/web/lib/observability/error-reporter.ts` is a vendor-neutral surface:

```ts
import {
  reportError,
  reportMessage,
  setUser,
  installErrorReporter,
} from '@/lib/observability/error-reporter';

reportError(err, { tags: { feature: 'checkout' }, requestId: err.requestId });
```

- Default reporter logs to `console`. No network traffic in dev.
- A vendor SDK (Sentry, Datadog Browser, …) is installed by calling `installErrorReporter(adapter)` at boot — typically inside a `'use client'` provider that wraps the rest of the tree.
- All public functions swallow exceptions thrown by the active reporter — telemetry can never crash the app.

Hookup points:

- `GlobalErrorBoundary` (`apps/web/components/error-boundary.tsx`) — catches render-time crashes and calls `reportError({ tags: { boundary: 'global' } })`.
- `app/(shop)/error.tsx` — route-level boundary that reports the error then renders a recovery CTA.
- `AsyncBoundary` (`lib/ux/async-boundary.tsx`) — wraps suspense-throwing queries; combined with `react-error-boundary` so a single failing query doesn't tear down the page.

## API error reporting

The API already has correlation ids and structured logs. To stream errors to an external sink:

1. Subscribe a transport in `LoggerModule`'s pino config (no code changes outside `logger.module.ts`).
2. Or wire OpenTelemetry by adding an `@opentelemetry/sdk-node` initialiser in `main.ts` before `NestFactory.create`.

Both options live behind the same correlation-id model, so traces from the SDK can be joined to error reports from the storefront via `x-request-id`.

## Health checks

- `apps/api/src/health/` exposes a Nest health module covering Postgres + Redis. Hook this into your platform's liveness/readiness probe.
- Operations dashboards consume `/v1/ops/*` (feature flags, audit log) — see `docs/api-conventions.md`.

## Adding a vendor

1. Implement the `ErrorReporter` interface for the vendor's browser SDK (3 methods: `reportError`, `reportMessage`, `setUser`).
2. Call `installErrorReporter(yourAdapter)` from a `'use client'` boot component near the root of `<Providers>`.
3. Pass `requestId` through `ApiError.requestId` so vendor breadcrumbs link to API logs.
4. For server-side traces, register the vendor's OTel/SDK boot in `apps/api/src/main.ts` before `NestFactory.create(AppModule)`.

This contract intentionally hides whether the chosen vendor is Sentry, Datadog, Honeycomb, or a self-hosted OTel collector. Swap the adapter; the rest of the codebase doesn't move.

## Reliability primitives

`apps/api/src/common/outbound-http.ts` exposes `withTimeout`, `withRetry`, and `fetchWithTimeout`. Wrap calls to Stripe/email/carrier providers so a slow third party can't pin a request thread.
