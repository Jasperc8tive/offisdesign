# Acceptance Report — v1.0.0 (RC1)

**Report date:** 2026-06-27
**Subject:** Offisdesign platform, Release Candidate 1
**Decision sought:** Approval to promote RC1 to v1.0.0 and launch.

This report is the formal record of what was verified during Stage 15 and what's outstanding. It is the document a launch reviewer or auditor reads to decide whether the platform is ready.

## 1. Scope

Acceptance covers the storefront, admin, API, worker, database, design system, and infrastructure manifests that compose the Offisdesign monorepo at tag `v1.0.0-rc.1`.

Out of scope for this document: customer support tooling, marketing site (handled separately), legal copy.

## 2. Method

| Activity                 | How verified                                     | Result                                                                          |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Architecture review      | Stage 0–14 deliverables + `docs/architecture.md` | Conforms                                                                        |
| Type safety              | `pnpm -w typecheck`                              | 15/15 ✓                                                                         |
| Lint                     | `pnpm -w lint`                                   | 15/15 ✓ (full turbo)                                                            |
| Unit + integration tests | `pnpm -w test`                                   | 96/96 ✓ (web 42, api 51, utils 3)                                               |
| Build                    | `pnpm -w build`                                  | 9/9 ✓                                                                           |
| Docker image build       | `Release` workflow dry-run                       | Passes locally — production build pending registry credentials                  |
| Lighthouse CI thresholds | `lighthouserc.cjs` config                        | Configured to fail on CWV regression. Live run scheduled T-1h.                  |
| RBAC                     | Backend `@RequirePermissions` + UI `<Can>` audit | Enforced server-side on every admin route; UI gates match.                      |
| Security workflow        | `.github/workflows/security.yml`                 | Configured (CodeQL, Trivy, `pnpm audit`). Live run scheduled at first CI cycle. |
| Backup script            | `scripts/backup.sh`                              | Verified locally against dev Postgres. Production drill scheduled T-12h.        |
| Restore script           | `scripts/restore.sh`                             | Verified locally. Production drill scheduled T-12h.                             |

## 3. Customer-journey validation

The following journeys were code-walked end-to-end. Each step exists, is wired to the expected service, and has type-safe response handling:

| Journey                                     | Surface                                 | Notes                                                      |
| ------------------------------------------- | --------------------------------------- | ---------------------------------------------------------- |
| Browse → search → collection → PDP          | Storefront                              | SSR + generateMetadata; CWV thresholds enforced.           |
| Add to cart                                 | Storefront cart provider                | Optimistic update + invalidation.                          |
| Wishlist toggle (anonymous + authenticated) | Wishlist provider                       | Two-mode with one-shot merge on sign-in. Unit tested.      |
| Guest checkout                              | `/checkout`                             | 4-step state machine; gated on API success.                |
| Stripe Payment Element                      | `<PaymentStep>`                         | Mock fallback in dev; live keys swap-in at deploy.         |
| Order confirmation                          | `/checkout/[id]/confirmation`           | Reads order; dispatches `purchase_confirmed`; clears cart. |
| Customer registration + verify              | `/account/register` + `/account/verify` | Email-token verification.                                  |
| Customer login                              | `/account/login`                        | Cookie session; refresh-token rotation on 401.             |
| Customer account journey                    | `/account/*`                            | Orders, addresses CRUD, profile, password, sessions.       |
| Reviews submission + helpful vote           | PDP `<ReviewsSection>`                  | Verified-purchase flag, pending moderation.                |

Live execution against the production environment is scheduled in `docs/launch-checklist.md` §T-1h smoke tests.

## 4. Admin-journey validation

| Journey                        | Surface                  | Result                                                |
| ------------------------------ | ------------------------ | ----------------------------------------------------- |
| Admin login                    | `/login`                 | Wired to `/v1/auth/admin/login`; cookie session.      |
| Product publish/archive/delete | `/catalog/products/[id]` | Permission-gated via `<Can any={['catalog:write']}>`. |
| Bulk publish/archive           | `/catalog/products`      | Multi-select + toast feedback.                        |
| Order detail review            | `/orders/[id]`           | Refund + resend email surfaced as Stage 14 stubs.     |
| Customer profile review        | `/customers/[id]`        | Profile + verification.                               |
| CMS page publish/archive       | `/cms/pages`             | Permission-gated `cms:publish`.                       |
| Feature flag toggle            | `/operations/flags`      | Optimistic with rollback.                             |
| Audit log review               | `/operations/audit`      | Append-only viewer.                                   |
| Queue monitoring               | `/operations/queues`     | 5s poll; cache-flush gated on `system:cache`.         |
| Command palette                | `⌘K` global              | Filters by permission scope.                          |

The Stage 13 architectural rule "hide, don't disable" is enforced — items the principal can't access never render.

## 5. Performance

| Metric               | Target   | Source of truth                 |
| -------------------- | -------- | ------------------------------- |
| LCP                  | ≤ 2.5 s  | Lighthouse CI assertion (error) |
| CLS                  | ≤ 0.1    | Lighthouse CI assertion (error) |
| INP                  | ≤ 200 ms | Lighthouse CI assertion (warn)  |
| FCP                  | ≤ 1.8 s  | Lighthouse CI assertion (warn)  |
| TBT                  | ≤ 200 ms | Lighthouse CI assertion (warn)  |
| Performance score    | ≥ 95     | Lighthouse CI assertion (error) |
| Accessibility score  | 100      | Lighthouse CI assertion (error) |
| Best practices score | 100      | Lighthouse CI assertion (error) |
| SEO score            | 100      | Lighthouse CI assertion (error) |

Routes audited: `/`, `/search`, `/cart`, `/account/login`, `/account/register`. PDP and collection routes are not in CI because they need a populated database — they are part of the manual smoke pass.

Load test against staging is deferred to 1.0.1 (see `docs/known-limitations.md` §7).

## 6. Security

| Control                                                    | Status                                        |
| ---------------------------------------------------------- | --------------------------------------------- |
| HttpOnly cookies + Redis JTI rotation                      | ✓                                             |
| Argon2id password hashing                                  | ✓                                             |
| Helmet on API                                              | ✓                                             |
| CSP on web (with Stripe allow-list)                        | ✓                                             |
| Per-route `@Throttle` on auth endpoints                    | ✓                                             |
| Zod request validation, no `forbidNonWhitelisted` bypasses | ✓                                             |
| `loadApiEnv()` validation at boot                          | ✓                                             |
| Log redaction (auth, cookies, password hashes)             | ✓                                             |
| Dependency audit, Trivy filesystem, CodeQL                 | ✓ (CI configured)                             |
| AV scan on uploads                                         | ⚠ Deferred (see Known Limitations §2)         |
| CSRF (cross-origin)                                        | ⚠ Documented — SameSite cookies suffice today |

## 7. Operations

| Capability                              | Status                                            |
| --------------------------------------- | ------------------------------------------------- |
| Liveness / readiness / health endpoints | ✓ `/v1/system/{livez,readyz,healthz}`             |
| Graceful shutdown                       | ✓ `enableShutdownHooks()` + tini PID 1            |
| Worker separation                       | ✓ `apps/api/src/worker.ts` + `Dockerfile.worker`  |
| Hourly backup                           | ✓ `scripts/backup.sh` + `k8s/cronjob-backup.yaml` |
| Restore script + drill procedure        | ✓ Procedure documented; drill scheduled T-12h     |
| Production env templates                | ✓ Three files                                     |
| K8s reference manifests                 | ✓ `k8s/`                                          |
| Production docker-compose               | ✓ `docker/docker-compose.prod.yml`                |
| Release workflow → GHCR                 | ✓ Matrix build for api/worker/web/admin           |
| Security workflow                       | ✓ Weekly schedule + on-PR                         |

## 8. Documentation

The platform ships 35+ documents under `docs/`. Critical for launch:

| Document                  | Purpose                                |
| ------------------------- | -------------------------------------- |
| `architecture.md`         | System overview                        |
| `deployment.md`           | How to deploy on any of six providers  |
| `infrastructure.md`       | Component inventory + scaling guidance |
| `disaster-recovery.md`    | RTO ≤ 30 min, RPO ≤ 1 h playbook       |
| `runbooks.md`             | Per-incident scripts                   |
| `operations-handbook.md`  | Day-to-day cadence                     |
| `launch-checklist.md`     | Launch-day step list                   |
| `post-launch-runbook.md`  | First 72 hours                         |
| `known-limitations.md`    | What we deliberately deferred          |
| `release-notes-v1.0.0.md` | Customer-facing release notes          |

## 9. Outstanding work before 1.0.0 final

Items that must complete between RC1 approval and tag `v1.0.0`:

1. Live restore drill against production-shaped data; log result in `docs/disaster-recovery.md`.
2. Lighthouse CI run against the production URLs; baseline numbers recorded.
3. Stripe live webhook signature verified end-to-end against the production endpoint.
4. Cross-browser smoke matrix executed (six device/browser combinations).
5. Backup CronJob first scheduled run observed in production logs.
6. Maintenance-mode middleware wired and tested.

Items acceptable for 1.0.0 with documented deferral (see `docs/known-limitations.md`):

1. AV scan on uploads.
2. Vendor SDK install for error reporting.
3. Outbound integration wrapping (`withTimeout` + `CircuitBreaker`).
4. Admin block editor.
5. Admin vitest harness.
6. Playwright admin journeys.
7. Visual regression suite.
8. Load test against staging.

## 10. Sign-off

| Role              | Name   | Sign-off date |
| ----------------- | ------ | ------------- |
| Engineering lead  | **\_** | **\_**        |
| Operations lead   | **\_** | **\_**        |
| Security reviewer | **\_** | **\_**        |
| Product owner     | **\_** | **\_**        |

Append sign-offs in this table before promoting RC1 to 1.0.0.
