# Security

This document summarises the security posture of the Offisdesign platform as of Stage 12 and the remediations applied.

## Authentication

- **Cookie-based sessions.** Access and refresh tokens are HttpOnly, SameSite-controlled (configurable per environment), and `Secure` in production (`apps/api/src/auth/cookie.helper.ts`).
- **Refresh single-flight.** A Redis-backed JTI store atomically rotates refresh tokens on every refresh and revokes the previous JTI — replays return 401 (`apps/api/src/auth/auth.service.ts`, `apps/api/src/redis/refresh-token.store.ts`).
- **Password hashing.** Argon2id (`apps/api/src/auth/password.service.ts`). Hash parameters are documented in the file.
- **Email verification + password reset** are token-based, single-use, and TTL-bounded server-side. Reset tokens are revoked on use even if the request body is malformed.

## Authorization

- All authenticated endpoints declare `@UseGuards(JwtAuthGuard)`.
- Admin-only endpoints additionally require `@Roles(...)` checked by the RBAC guard (`apps/api/src/rbac/`).
- Customer-scoped data is filtered by `customerId` derived from the JWT principal — never from a request body or query param.

## Cookies and CSRF

- Refresh and access cookies are HttpOnly + SameSite=Lax (default) so they are not sent on cross-site form posts. This blocks the most common CSRF vector for browser flows.
- The storefront and admin both run on first-party hostnames and call the API with `credentials: 'include'`. Cross-site state-changing requests are blocked by SameSite.
- If we expose the API to third-party origins in the future, add an explicit double-submit CSRF token; the design is documented in `docs/authentication.md`.

## Rate limiting

ThrottlerModule is globally enabled (`apps/api/src/app.module.ts`) at 120 req/min. Per-route overrides for sensitive endpoints (Stage 12):

| Endpoint                                    | Limit    |
| ------------------------------------------- | -------- |
| `POST /v1/auth/admin/login`                 | 10 / min |
| `POST /v1/auth/customer/login`              | 10 / min |
| `POST /v1/customer/register`                | 5 / min  |
| `POST /v1/customer/verify-email`            | 10 / min |
| `POST /v1/customer/request-password-reset`  | 3 / min  |
| `POST /v1/customer/complete-password-reset` | 5 / min  |

## Headers and CSP

- **API (`apps/api/src/main.ts`)**: `helmet()` enabled with defaults — `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` in production, default CSP.
- **Web (`apps/web/next.config.mjs`)**: explicit CSP via `headers()`:
  - `script-src 'self' 'unsafe-inline' https://js.stripe.com` (no `unsafe-eval` in prod)
  - `connect-src 'self' <API_URL> https://api.stripe.com`
  - `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`
  - `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`
  - `upgrade-insecure-requests` in prod
- `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy` strip camera/microphone/geolocation.

## Input validation

Every controller endpoint runs request bodies through `ZodValidationPipe` against a feature-owned schema. Unknown properties are rejected (`forbidNonWhitelisted: true` on the global `ValidationPipe`). The Zod schemas live alongside their domain, not in a shared DTO bag.

## XSS

- React escapes string children by default; JSON-LD blocks use `<script type="application/ld+json">` with a JSON-serialised payload from a typed builder (`components/seo/schemas.ts`).
- We do not call `dangerouslySetInnerHTML` outside CMS blocks. Blog content from the CMS will need a sanitiser when rich HTML lands in Stage 13.

## SSRF

- Storefront API base URL is a build-time constant (`NEXT_PUBLIC_API_URL`). The backend never forwards an arbitrary URL from a user-supplied field.
- Webhooks accept payloads from named providers only and verify signatures before processing (`apps/api/src/webhooks/`).

## SQL injection

- All database access is through Prisma's typed query builder — no raw SQL.
- Search queries use Prisma's `where` filters with parameterised inputs.

## File uploads

- 50 MB cap enforced by the media DTO (`apps/api/src/media/dto/media.dto.ts`).
- Content type is validated against an allow-list before issuing a pre-signed S3 PUT URL.
- **Open**: server-side magic-byte sniff and AV-scan stub are not yet wired. Tracked under "Remaining work".

## Secrets

- `loadApiEnv()` (`packages/config/src/env.ts`) validates every required secret with Zod at boot. Missing or under-length values throw before the server accepts traffic.
- JWT secrets enforce a 32-char minimum.
- `.env*` files are in `.gitignore`; secrets are sourced from the deployment environment.
- Logger redaction (`apps/api/src/logger/logger.module.ts`) strips `authorization`, `cookie`, `passwordHash` from structured logs.

## Observability and incident response

Every request gets a UUIDv7 `x-request-id` (`apps/api/src/common/request-id.middleware.ts`). The storefront's API client generates a request id per call and forwards it — see `docs/observability.md`.

## Findings summary

| Area                            | Status                                    |
| ------------------------------- | ----------------------------------------- |
| Cookies + JWT rotation          | ✓ Hardened                                |
| CSP (web)                       | ✓ Stage 12                                |
| Rate limiting on auth endpoints | ✓ Stage 12                                |
| Helmet on API                   | ✓                                         |
| Zod request validation          | ✓                                         |
| Secret validation at boot       | ✓                                         |
| Argon2id passwords              | ✓                                         |
| Sanitised CMS HTML              | ⚠ Pending Stage 13                        |
| AV scan on uploads              | ⚠ Tracked                                 |
| External-origin CSRF            | ⚠ Document-only (SameSite suffices today) |
