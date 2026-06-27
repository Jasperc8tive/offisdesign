# Release Notes — v1.0.0 (RC1)

**Release date:** 2026-06-27 (RC1) — pending soak before final tag.

**Audience:** Engineering, operations, and stakeholders preparing for the public launch.

## Summary

Offisdesign 1.0.0 is the first production release of the Shopify-free commerce platform. It replaces the previous storefront and admin tools end-to-end with an in-house stack: a NestJS API, a Next.js storefront, a Next.js admin console, a Prisma + Postgres database, and a Redis-backed queue.

The release is a full re-platforming — the public surface (URLs, SEO, brand) was preserved during build-out; the underlying stack is new. The feature list covers everything customers had on the legacy site plus the operational primitives the business needs to run without vendor lock-in.

## What's in 1.0.0

### Customer-facing

- Browsing — home, search with facets, collection pages, category trees, PDP with reviews, recently viewed strip.
- Cart with coupon codes, applied promotions, persistence across devices for signed-in customers.
- Multi-step checkout: address → shipping method → payment (Stripe Payment Element) → review → order placed.
- Customer account: orders list + detail, addresses CRUD, profile editing, password change, active session management, email verification.
- Wishlist (anonymous local-storage, server-backed when signed in, merged on login).
- Email transactional notifications (welcome, verify, password reset, order placed/paid).

### Staff-facing

- Admin dashboard with revenue / orders / customers / low-stock / queue widgets.
- Products list + detail with publish/archive/duplicate.
- Orders list + detail.
- Customers list + profile.
- CMS pages list with publish/archive.
- Operations console: feature flags, audit log, queue health + cache flush.
- Command palette (⌘K) keyboard navigation.
- Permission-aware UI — actions the principal can't take never render.

### Platform

- Docker images for api, worker, web, admin — multi-stage, non-root, with HEALTHCHECK and `tini` PID 1.
- Reference Kubernetes manifests + production docker-compose.
- CI pipeline covering typecheck, lint, unit tests, build, Storybook, Lighthouse CI, dependency audit, Trivy, CodeQL.
- Release workflow that publishes container images to GHCR.
- Hourly backup script + Kubernetes CronJob; restore script.
- Documented runbooks, disaster-recovery playbook, operations handbook.

## Breaking changes

None — first release.

## Upgrade notes

Not applicable. See `docs/deployment.md` for a fresh production setup.

## Migration notes

Not applicable. If you are migrating data from a legacy Shopify store, the import pipeline is owned by ops and lives outside this release. The Prisma schema in `packages/database/prisma/schema.prisma` is the contract.

## Known limitations

See `docs/known-limitations.md`. The headline items at RC1:

1. Admin CMS block editor is read-only; full drag-reorder + preview lands in 1.1.
2. AV scan + magic-byte verification on media uploads is documented but not yet wired.
3. Vendor SDK for client error reporting (Sentry/Datadog) is not yet selected — the integration channel is in place.
4. Outbound integration calls (Stripe, mailer, carriers) do not yet route through the `withTimeout` + `CircuitBreaker` primitives.

## Thanks

Stages 0 through 14 covered architecture, design system, backend foundation, catalog, search, customer + cart, payments, checkout, account, CMS, Stage 11 shopping journey, Stage 12 production hardening, Stage 13 admin platform, Stage 14 deployment + infrastructure. Stage 15 produced this Release Candidate.

Approve RC1 to promote to 1.0.0.
