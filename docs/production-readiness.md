# Production Readiness

A consolidated pre-launch checklist for the Offisdesign platform after Stage 12.

## Build and deployment

- [x] `pnpm -w typecheck` clean
- [x] `pnpm -w lint` clean
- [x] `pnpm -w test` passes (web + api + utils)
- [x] `pnpm -w build` produces deployable artefacts for `apps/web` and `apps/api`
- [x] Lighthouse CI thresholds enforced for 5 production routes
- [ ] Container images built and pushed (deploy pipeline-owned)
- [ ] Database migration runbook reviewed (Stage 13)

## Configuration

- [x] All required secrets validated at boot via `loadApiEnv()` and `loadWebEnv()`
- [x] JWT secrets enforce 32-char minimum
- [x] `NEXT_PUBLIC_API_URL` baked into the web build
- [x] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` baked when Stripe is enabled
- [ ] `NEXT_PUBLIC_MEDIA_HOSTNAME` set once CDN is provisioned

## Security

See `docs/security.md`. Stage 12 closes:

- [x] Per-route rate limits on auth, register, password reset
- [x] Explicit CSP with Stripe allow-list
- [x] Permissions-Policy, X-Frame-Options, X-Content-Type-Options
- [ ] AV scan on uploads (deferred; tracked)
- [ ] CMS HTML sanitiser when rich content lands

## Performance

See `docs/performance.md`.

- [x] `next/image` with AVIF/WebP, blur placeholders, priority hint on LCP image
- [x] Route-level loading/error boundaries
- [x] Lighthouse CI: LCP ≤ 2.5 s, CLS ≤ 0.1 enforced as errors
- [ ] Server-side prefetch (`HydrationBoundary`) on PDP + collection (Stage 13)
- [ ] Pre-computed `blurDataURL` per media asset

## Accessibility

See `docs/accessibility.md`.

- [x] Lighthouse a11y = 100 on every audited route (enforced)
- [x] Skip-to-content link, landmarks, focus-visible rings
- [x] Form fields labelled via `<FormField>`
- [ ] vitest-axe smoke tests
- [ ] Cart "added" live region

## Observability

See `docs/observability.md`.

- [x] `x-request-id` propagation web → API
- [x] Structured logs with redaction
- [x] Vendor-neutral `reportError` channel
- [x] Global + route-level error boundaries
- [ ] Vendor SDK chosen and `installErrorReporter()` wired
- [ ] Health-check probe surfaced in deploy platform

## Reliability

- [x] `withTimeout` / `withRetry` helpers in `apps/api/src/common/outbound-http.ts`
- [x] Idempotency keys on order placement
- [ ] Apply `withTimeout` to every Stripe / mailer / carrier call (refactor pass)
- [ ] Circuit-breaker policy for repeated outbound failures (foundation only today)

## Data

- [x] Prisma schema clean (`pnpm --filter @offisdesign/database typecheck`)
- [ ] Production seed strategy reviewed
- [ ] Backup + restore drill scheduled

## Runbooks

| Scenario                | Document                                  |
| ----------------------- | ----------------------------------------- |
| Login broken            | `docs/authentication.md`                  |
| Stripe webhook failing  | `docs/checkout.md` + provider dashboard   |
| Email delivery degraded | `docs/notifications.md`                   |
| Cache thrash            | `docs/api-conventions.md` (Redis section) |
| A11y regression         | `docs/accessibility.md`                   |
| CSP violations          | `docs/security.md`                        |

## Stage 13 candidates

Items deferred from Stage 12 with intentional cost/benefit calls:

1. Server-side prefetch on PDP and collection.
2. Image derivative + blur generation pipeline in the upload queue.
3. AV scan + magic-byte sniff on uploads.
4. `vitest-axe` and `@axe-core/playwright` integration.
5. CMS HTML sanitiser (depends on rich-text editor selection).
6. Circuit breaker on outbound HTTP.
7. Vendor SDK install for client error reporting.
