# Operations Handbook

The day-to-day rhythm of running the Offisdesign platform. Where the runbook tells you what to do in an incident, this document tells you how to keep incidents rare.

## On-call

- **Primary on-call** carries the page, owns triage, and is empowered to roll back any change without prior approval.
- **Secondary** shadows the primary, ready to take over after 30 min of active engagement.
- **Rotation length**: weekly. Hand-off at Monday 10:00 local time; the outgoing primary writes a one-paragraph state-of-the-system note.
- Pages go to a single channel — anything that triggers on call must be actionable. If it isn't, the alert is wrong, not the engineer.

## Routine work

| Cadence   | Task                                                                                     |
| --------- | ---------------------------------------------------------------------------------------- |
| Daily     | Skim the audit log for anything unexpected (`/operations/audit`).                        |
| Daily     | Glance at queue dashboard. Backlog at start-of-day is the early warning.                 |
| Weekly    | Rotate the on-call. Outgoing primary briefs incoming.                                    |
| Weekly    | Review `Security` workflow runs (`.github/workflows/security.yml`). Triage anything new. |
| Monthly   | Verify backups (`scripts/backup.sh`) succeeded every hour without gaps.                  |
| Monthly   | Rotate any human-shared secrets. JWT secrets in particular.                              |
| Quarterly | Restore drill (`docs/disaster-recovery.md` §Restore drills). Log the result.             |
| Quarterly | Dependency major-version review.                                                         |

## Deploys

- Deploys go out via the `Release` workflow on every push to `main`. Tagged versions promote to production manually via the platform UI.
- The deploy is **not** the release. A release is a tagged version + a changelog entry + a deploy.
- Blameless retros for any rollback. Document under "Past incidents" in `docs/runbooks.md`.

## Maintenance mode

`POST /v1/admin/ops/maintenance/on` flips the global maintenance flag. Storefront responds with a static "back shortly" page; admin still works for staff so the operation can run. Use sparingly:

- planned migrations that cannot be done online,
- recovery operations during an incident,
- never as a substitute for fixing a bug.

Always announce maintenance ≥ 24 h in advance via the storefront announcement bar (`/operations/notifications` — Stage 14 surface).

## Secret rotation

| Secret               | Rotation cadence             | Procedure                                                             |
| -------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `JWT_ACCESS_SECRET`  | annually or on incident      | Roll, deploy; all customers sign back in within `JWT_ACCESS_TTL_SEC`. |
| `JWT_REFRESH_SECRET` | annually or on incident      | Roll, deploy; all customers fully signed out — communicate.           |
| `STRIPE_*`           | per Stripe's recommendations | Rotate in Stripe dashboard first, then env.                           |
| `S3_*`               | quarterly                    | IAM rotation; overlap old + new keys for 24 h.                        |
| `SMTP_PASSWORD`      | quarterly                    | Generate, update env, verify a test send.                             |
| Database password    | annually                     | Managed Postgres exposes a non-disruptive rotation flow.              |

After every rotation, write the date and operator into `docs/security.md` §Findings summary.

## Feature flags

The `system:flags` permission gates the admin flag screen. Use flags for:

- **Kill switches** on integrations that may misbehave (e.g. `payments.stripe.enabled`).
- **Gradual rollouts** of risky changes (the `rollout` field is a percentage).
- **Per-environment toggles** that don't justify a code change.

Don't use flags for permanent configuration — that belongs in env. Garden the flag list quarterly: anything that's been at a stable value for two quarters is a config, not a flag.

## Performance budget review

Every quarter, review:

1. Lighthouse CI trend across the audited routes (`docs/performance.md`).
2. Database slow-query log; promote anything >100 ms p95 to a backlog ticket.
3. Bundle size delta from main branch — anything that pushed first-load JS up by >5 % needs a justification.

## Cost review

Monthly: pull the bill, compare against the prior month, and identify the line item that grew most. Track in a private doc; if a line item grows >20 % MoM, open a ticket.

## What "good" looks like

- p95 API latency: ≤ 200 ms inside the data centre.
- p95 storefront LCP: ≤ 2.5 s.
- Error rate: ≤ 0.5 % of requests.
- Queue backlog: ≤ 100 waiting jobs across all queues at any given time.
- Restore drill: passes in ≤ 30 minutes from first command to verified `healthz`.
- Backup completeness: 100 % of hours have a dump for the last 30 days.

When any of these drift, you have a heads-up rather than an incident.
