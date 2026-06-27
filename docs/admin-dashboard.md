# Admin Dashboard

The admin dashboard (`apps/admin/app/page.tsx`) is the first thing staff see after sign-in. It surfaces operational health at a glance — never deep analytics.

## Widgets

| Widget           | Permission       | Source endpoint                                            |
| ---------------- | ---------------- | ---------------------------------------------------------- |
| Revenue (recent) | `orders:read`    | `GET /v1/checkout/orders?pageSize=50` (summed client-side) |
| Orders count     | `orders:read`    | same query as above                                        |
| Customers count  | `customers:read` | `GET /v1/admin/customers?pageSize=1` (total only)          |
| Products count   | `catalog:read`   | `GET /v1/admin/catalog/products?pageSize=1`                |
| Low stock        | `inventory:read` | `GET /v1/admin/inventory/low-stock?threshold=5`            |
| Queue health     | `system:audit`   | `GET /v1/admin/ops/queues` (polled every 15 s)             |
| System health    | `system:audit`   | Link to operations console                                 |

## Permission gating

Each widget is wrapped in `<Can any={[…]}>`. A widget the principal can't see is not rendered — the dashboard layout reflows naturally. Backend queries are `enabled: can(scope)` so unauthorised users never even issue the request.

## Polling

- Queue health refetches every 15 s — short enough to surface a backed-up queue inside a normal triage window, long enough not to thrash the API.
- All other widgets use the default React Query staleTime (30 s) and refetch on focus is disabled in `QueryProvider`.

## Future widgets (Stage 14 candidates)

- Pending reviews count (wire `/v1/admin/reviews?status=PENDING`)
- Failed webhook deliveries (wire `/v1/admin/webhooks/deliveries?status=failed`)
- Scheduled CMS publications (wire `/v1/admin/cms/pages?status=SCHEDULED`)
- Search performance (top zero-result queries from `/v1/admin/ops/search-analytics`)

Each follows the same shape: a permission scope on the wrapper, a `useQuery` with `enabled: can(scope)`, a `<StatCard>` or `<Card>` shell, and a link to the detail page.

## What the dashboard intentionally avoids

- **No charts.** Time-series analytics belong in a dedicated analytics dashboard surface, not the operational overview.
- **No notifications inbox.** The header bell is reserved for actionable alerts (Stage 14).
- **No editable widgets.** The dashboard is read-only; clicking through is always the right next action.
