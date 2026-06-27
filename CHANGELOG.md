# Changelog

All notable changes to the Offisdesign platform are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc.1] — 2026-06-27

Release Candidate 1. Feature-complete platform; only bug fixes accepted between RC1 and 1.0.0.

### Added — across all stages

- **Storefront** (Next.js 15, App Router): homepage, search, collections, category trees, PDP with reviews + inventory + recommendations, cart with coupons, multi-step checkout with Stripe Payment Element, customer account (orders, addresses, profile, password, sessions), wishlist (anonymous + server-backed), recently viewed.
- **Admin** (Next.js): shell with sidebar / breadcrumbs / command palette, dashboard with revenue/orders/customers/low-stock/queue widgets, products list+detail with publish/archive/duplicate, orders list+detail, customers list+profile, CMS pages list with publish/archive, operations console (feature flags, audit log, queues + cache flush).
- **API** (NestJS): catalog, inventory, pricing, search, customer, cart, checkout, payments (Stripe + mock), notifications, tax, shipping, CMS, media, webhooks, ops (feature flags), audit, marketing, reviews, wishlist, jobs, health.
- **Design system** (`@offisdesign/ui`): typography, primitives, form controls, feedback, navigation, commerce, brand tokens.
- **Database** (`@offisdesign/database`): Prisma + Postgres, UUIDv7, composite PKs for joins, audit log, review/vote tables, wishlist join, abandoned-cart tracking.
- **Security**: HttpOnly cookies with Redis-JTI refresh rotation, Argon2id passwords, helmet on API, CSP on web allowing Stripe, per-route `@Throttle` on auth endpoints, Zod request validation, env validation at boot, log redaction.
- **Observability**: structured pino logs with correlation `x-request-id` end-to-end, vendor-neutral `reportError` channel, global + route-level error boundaries, `/v1/system/{livez,readyz,healthz}` health endpoints.
- **Performance**: `next/image` with AVIF/WebP + blur placeholders, route-level loading/error fallbacks, Lighthouse CI with CWV thresholds on five routes.
- **Reliability**: `withTimeout`, `withRetry`, `fetchWithTimeout`, `CircuitBreaker` primitives in `apps/api/src/common/`.
- **Deployment**: production-grade multi-stage Dockerfiles for api/worker/web/admin running as non-root with `tini` PID 1 and HEALTHCHECK, separate `worker.ts` entry, reference Kubernetes manifests, production docker-compose.
- **CI/CD**: typecheck/lint/test/build/storybook/lighthouse on every PR, Trivy + CodeQL + `pnpm audit` weekly, container image release matrix to GHCR.
- **Operations**: hourly backup script + Kubernetes CronJob, restore script, cron template, env templates for production.
- **Documentation**: 30+ markdown documents covering architecture, design, brand, every backend module, performance, accessibility, security, observability, deployment, infrastructure, disaster recovery, runbooks, operations handbook.

### Notable design decisions

- Architecture stays strictly layered: pages → sections → components on the client; controllers → application services → domain → repositories on the server. No business logic in the frontend.
- Payment provider hidden behind a `<PaymentStep>` boundary — Stripe is one implementation; a mock provider lets the local stack run without keys.
- Two-mode wishlist: anonymous (localStorage) and authenticated (server-backed), with a one-shot merge on sign-in. The hook contract is identical in both modes.
- Vendor-neutral error reporter and analytics sink: swap the adapter; the rest of the codebase doesn't change.

### Known limitations at RC1

See `docs/known-limitations.md` for the full list. The headline items:

- Admin CMS block editor is read-only; full drag-reorder + preview lands in 1.1.
- AV scan + magic-byte verification on media uploads is documented but not yet wired.
- Error-reporter vendor SDK (Sentry/Datadog) not yet selected — the channel is ready, no integration call is made.
- Outbound integration calls (Stripe, mailer, carrier) do not yet pass through `withTimeout` + `CircuitBreaker` — primitives ready, refactor pass pending.
- Restore drill has been documented but not yet rehearsed against the production target.

### Migration notes

This is the first tagged release. No migration from prior versions.

[1.0.0-rc.1]: https://github.com/offisdesign/offisdesign/releases/tag/v1.0.0-rc.1
