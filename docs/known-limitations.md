# Known Limitations — v1.0.0 (RC1)

What the platform deliberately doesn't do at RC1, with the reason for each deferral. Anything not listed here is either fully implemented or a defect — file an issue.

## 1. Admin CMS block editor is read-only

**Status at RC1**: pages list, publish, and archive work end-to-end. Block CRUD, drag-reorder, and live preview are deferred to 1.1.

**Why**: the block editor is a substantial design effort (drag-and-drop UX, undo, preview cookie signing). The backend already supports it (`POST /v1/admin/cms/pages/:id/blocks/reorder`). The storefront renders blocks correctly. The missing piece is the admin authoring surface.

**Workaround**: edit blocks via direct API calls or seed scripts until the editor lands.

## 2. AV scan and magic-byte verification on uploads

**Status at RC1**: media upload accepts files up to 50 MB, validates the MIME on the DTO, and stores via S3 pre-signed PUT. There is no virus scan and no magic-byte sniff.

**Why**: AV requires an external service (ClamAV daemon, CloudGuard, etc.) and an architectural decision on whether to scan inline (slow upload, deterministic) or async (fast upload, late rejection). Deferred to 1.1 alongside the decision.

**Accepted risk**: uploads are restricted to authenticated admin users (`media:write`), which puts the attack inside the staff trust boundary. The risk surface is small; the cost is "do not paste a binary you didn't expect to a customer's email."

## 3. Client error-reporter vendor SDK not installed

**Status at RC1**: `reportError`, `reportMessage`, `setUser` channel exists. The default sink logs to console. No vendor SDK is wired.

**Why**: vendor choice (Sentry vs Datadog vs self-hosted OTel) is owner-tunable and shouldn't be pre-decided in the platform repo. Stage 12 explicitly built the channel to be vendor-neutral.

**Action to enable**: pick a vendor, write a 50-line adapter implementing the three-method `ErrorReporter` interface, call `installErrorReporter(adapter)` in a client provider. See `docs/observability.md` §"Adding a vendor".

## 4. Outbound integrations don't yet route through `withTimeout` + `CircuitBreaker`

**Status at RC1**: the primitives exist in `apps/api/src/common/outbound-http.ts` and `circuit-breaker.ts` and are unit-tested. Stripe, mailer, carrier, and tax provider calls do not yet pass through them.

**Why**: each integration needs a per-vendor breaker configuration (timeouts, retry-on classes, failure thresholds). That's a focused refactor pass, not a primitive to land in the platform.

**Action**: 1.0.1 should wrap Stripe and mailer; carriers and tax follow when their volume justifies it.

## 5. Production restore drill never executed

**Status at RC1**: `scripts/backup.sh` and `scripts/restore.sh` exist and the Kubernetes `CronJob` is documented. The drill is a write-up in `docs/disaster-recovery.md` §Restore drills. We have not run the drill against a real production-shaped target.

**Why**: pre-launch this requires a production-shaped fixture. The right time to run the first drill is during launch preparation.

**Action**: scheduled in `docs/launch-checklist.md` §T-12h.

## 6. Real-vendor cross-browser matrix

**Status at RC1**: automated checks run on the CI Linux runner. Lighthouse CI hits five routes on desktop preset. We have not yet executed the full cross-browser matrix (Chrome/Edge/Firefox/Safari × desktop/mobile/tablet) on real devices.

**Why**: the matrix is a manual QA pass that needs the production environment standing.

**Action**: scheduled in `docs/launch-checklist.md` §T-1h smoke tests; an extended pass happens within the first week of live traffic.

## 7. Load and stress testing

**Status at RC1**: not yet executed. The API and admin are stateless behind an HPA configured to scale to 10 replicas; the worker is a separate deployment that scales independently. Architecturally we expect to handle the expected launch traffic, but the numbers are projections.

**Why**: meaningful load tests need production-grade Postgres + Redis behind them; running against a single-node dev compose tells you nothing.

**Action**: a k6 / artillery script runs against a staging environment with the same shape as production, recorded in `docs/performance.md`. Scheduled for 1.0.1.

## 8. Admin lacks a vitest harness

**Status at RC1**: admin app has no own test runner. Type safety and RBAC are checked at the type level + via the storefront's RBAC patterns.

**Why**: Stage 13 prioritised the user-facing surface; Stage 14 prioritised deployment.

**Action**: 1.1. Mirror the storefront's vitest setup; first test target is the `<Can>` permission gate.

## 9. Playwright admin journeys + visual regression

**Status at RC1**: no Playwright suite exists for the admin yet. Visual regression is also not wired.

**Why**: same as #8.

**Action**: 1.1.

## 10. Maintenance-mode endpoint stub

**Status at RC1**: `docs/runbooks.md` and `docs/post-launch-runbook.md` reference `POST /v1/admin/ops/maintenance/on`. The endpoint stub exists; the storefront's maintenance-mode middleware is not yet wired.

**Why**: a simple middleware piece — deliberately deferred so the storefront's request path doesn't grow in the last week before RC.

**Action**: 1.0.1.

## Accepted risks summary

| Limitation                     | Severity | Mitigation in place                                              |
| ------------------------------ | -------- | ---------------------------------------------------------------- |
| No AV on uploads               | Low      | Behind admin auth + RBAC                                         |
| No vendor error SDK            | Low      | Console sink logs locally; gradual rollout possible              |
| Integrations un-wrapped        | Medium   | Defaults are fail-fast; downstream incidents are visible quickly |
| Restore drill un-run           | Medium   | Runs T-12h before launch per checklist                           |
| Cross-browser matrix unrun     | Medium   | Smoke tests T-1h; extended pass week 1                           |
| Load test un-run               | Medium   | HPA + monitoring will catch problems live                        |
| Maintenance-mode endpoint stub | Low      | Workaround: scale replicas to 0                                  |

None of these are launch-blocking individually. The "GO WITH CONDITIONS" recommendation in the RC1 report names the subset that must complete before T-0.
