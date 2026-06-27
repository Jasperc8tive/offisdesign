# Post-Launch Runbook

The first 72 hours after launch. Use this alongside `docs/runbooks.md` (per-incident playbooks) and `docs/operations-handbook.md` (steady-state operations).

## Hour 0 → Hour 4 — Heightened monitoring

**On-call sits next to the dashboard.** No deploys, no schema changes, no flag flips during this window unless they're remediating an incident.

Watch for:

| Signal                 | Tool                 | Threshold                                |
| ---------------------- | -------------------- | ---------------------------------------- |
| API error rate         | log aggregator       | > 1 % of requests over a 5-min window    |
| Stripe charge failures | Stripe dashboard     | > 1 % of attempts                        |
| Readiness flap         | `kubectl get pods`   | any pod toggling Ready ↔ NotReady        |
| Queue backlog          | `/operations/queues` | waiting > 1000 on any queue              |
| Database connections   | managed-provider UI  | > 80 % of `DATABASE_POOL_MAX × replicas` |

Pre-canned remedies:

- **Queue spike**: scale `offis-worker` (`kubectl scale deploy/offis-worker --replicas=N`).
- **API CPU spike**: HPA will respond, but verify the autoscaler is actually scaling.
- **Image cache miss storm**: prewarm the CDN with the top 50 product slugs.

## Hour 4 → Hour 24 — Normal vigilance

Drop to 30-min check-ins. Confirm that:

- The hourly backup ran.
- The Stripe webhook dashboard shows green.
- Audit log entries look plausible (no unexpected admin actions).
- No new error patterns in the structured logs.

## Hour 24 → Hour 72 — Stabilisation

Resume normal cadence. Run a launch retrospective:

1. What surprised us?
2. What incidents fired (real or pages-without-incident)?
3. What's the longest p95 request path?
4. Which runbook entry got used? Was it correct?
5. What needs to land in 1.0.1 vs 1.1?

## Rollback

**When**: criteria in `docs/launch-checklist.md` §Rollback criteria.

**How**:

1. **Customer impact mitigation first.** `POST /v1/admin/ops/maintenance/on` if customer-visible.
2. **Swing the application back** — every platform supports image rollback to a prior tag. Use the tagged previous release. The Deployments use rolling strategy so the swap happens without downtime.
3. **Do NOT roll back the database** unless absolutely required. Forward-migrations are safe; backward-migrations risk data loss. The schema is designed so 1.0.0 → 1.0.x is always additive within a minor.
4. **Re-test from the smoke checklist** in `docs/launch-checklist.md` after the rollback.
5. **Document the incident** in `docs/runbooks.md` §Past incidents.

## Hotfix path

For a single-line bug that's blocking customers:

1. Branch from the tagged release: `git checkout -b hotfix/1.0.1 v1.0.0`.
2. Apply the fix + test.
3. Tag: `git tag v1.0.1 && git push --tags`.
4. The `Release` workflow builds the image; deploy via the platform UI.
5. Merge `hotfix/1.0.1` back into `main` to avoid drift.

Hotfix turnaround target: **30 minutes from PR open to image deployed**, achievable because every CI gate is on the PR.

## Comms

- **#ops** channel: status updates every 30 minutes during the first 4 hours, hourly through 24 hours.
- **Stakeholder thread**: only on-incident updates.
- **Customers**: only if customer-facing. Use the storefront announcement bar (CMS) for planned maintenance or known degradation.

## What "all clear" looks like

By T+72h:

- p95 API latency stable and under the targets in `docs/operations-handbook.md`.
- Lighthouse CI trend flat or improving.
- Zero open incidents.
- First weekly on-call rotation in flight without escalation to second-on-call.

At that point Stage 15 is complete, RC1 is promoted to 1.0.0 (drop the `-rc.1` suffix in package.json, tag, release), and the team returns to normal feature cadence under `docs/operations-handbook.md`.
