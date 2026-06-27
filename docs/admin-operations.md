# Admin Operations Console

`apps/admin/app/operations/` exposes the operational levers staff need to run the platform without shelling into a server.

## Surfaces

| Route                       | Purpose                                     | Permission                     |
| --------------------------- | ------------------------------------------- | ------------------------------ |
| `/operations/flags`         | Feature flag toggles                        | `system:flags`                 |
| `/operations/queues`        | BullMQ queue health + cache flush           | `system:audit`, `system:cache` |
| `/operations/audit`         | Audit log viewer                            | `system:audit`                 |
| `/operations/notifications` | Notification template management (Stage 14) | `system:settings`              |

## Feature flags

`GET /v1/admin/ops/feature-flags` returns the entire flag catalogue. The page renders each as a `<Card>` with a `<Switch>`; toggles use an **optimistic update** (`onMutate` swaps the row, rollback on error) so the UI feels instant.

Flag changes propagate via the API's Redis-backed flag store. Storefront reads cache for 30 s, so toggles take effect within seconds across all nodes.

## Queues

`GET /v1/admin/ops/queues` returns a snapshot of every BullMQ queue:

```ts
{
  queues: [
    { name, waiting, active, failed, completed? },
    …
  ]
}
```

The page polls every 5 s. The "failed" count highlights in `outline` when non-zero so on-call attention is drawn immediately.

A cache-flush bar at the top exposes per-scope buttons (`catalog`, `cms`) gated on `system:cache`. The endpoint is `POST /v1/admin/ops/cache/flush { scope }`.

## Audit log

`GET /v1/admin/audit` is paginated and append-only — every privileged action across the platform writes a row server-side. The viewer renders:

- **When.** ISO timestamp formatted to the viewer's locale.
- **Actor.** Principal kind + truncated id.
- **Action / entity.** What was done and to which object.

The list is read-only — re-entering history would defeat the purpose. Stage 14 candidates: filter by entity, by actor, by date range.

## Notifications

`/operations/notifications` is reserved for Stage 14. The backend already exposes:

- `GET /v1/admin/notifications/templates` (list templates)
- `PATCH /v1/admin/notifications/templates/:key` (update body/subject)
- `POST /v1/admin/notifications/enqueue` (send a one-off)
- `GET /v1/admin/notifications/deliveries` (delivery history + retry)

Build them following the same pattern: `<DataTable>` + `<Can>`-gated action buttons + `useMutation` with toast feedback.

## Permission scopes

The complete admin permission set lives in `apps/api/src/rbac/permissions.ts`. The most relevant scopes for operations:

| Scope             | Grants                       |
| ----------------- | ---------------------------- |
| `system:flags`    | Read + write feature flags   |
| `system:settings` | Read + write system settings |
| `system:audit`    | Read audit log, queue health |
| `system:cache`    | Flush caches                 |
| `system:webhooks` | Manage webhook subscriptions |
| `*`               | Wildcard — super-admin       |

A principal with `*` sees everything. Otherwise scopes are checked individually by `<Can any={[…]}>` and `@RequirePermissions(…)` server-side.

## Reliability primitives

Outbound calls from API services (Stripe, mailer, carriers) should use `withTimeout` + `withRetry` from `apps/api/src/common/outbound-http.ts`. Failures land in the audit log via the `OutboundError` shape, which surfaces in this console.

See `docs/observability.md` for the cross-system trace model.
