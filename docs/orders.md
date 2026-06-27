# Orders

`Order` is the immutable record of a completed checkout. Lifecycle hooks are
expressed as append-only `OrderEvent` rows.

## Aggregate

- `Order` — header (number, customer, addresses, totals, status).
- `OrderItem` — denormalised line snapshot at placement time. The order does
  not rely on the live `ProductVariant` because variants can be renamed,
  retitled, or deleted.
- `Payment` — provider-agnostic record; `providerData` is the raw provider
  payload.
- `OrderEvent` — append-only ledger (`OrderPlaced`, `OrderCancelled`, etc.)
  Service layer enforces no UPDATE/DELETE on this table.

## Order number

`OD-YYYYMM-XXXXXXX` where the suffix is 7 chars of Crockford-style base32
randomness. Designed to be **unguessable yet readable** when read aloud.

## Endpoints

| Method | Path                      | Auth           | Notes                                            |
| ------ | ------------------------- | -------------- | ------------------------------------------------ |
| GET    | `/v1/checkout/orders`     | JWT (customer) | Paginated, sorted by `placedAt` desc             |
| GET    | `/v1/checkout/orders/:id` | JWT            | 404 if the order belongs to a different customer |

Admin order management lands in Stage 7 (admin UI) — the application service
already exposes the methods.

## Status lifecycle

- `PENDING` — order row created but payment not yet captured. Currently we
  set `PAID` directly in the placement pipeline because the flow runs
  `confirm` synchronously.
- `PAID` — payment captured (the default after Stage 6 placement).
- `FULFILLING` / `SHIPPED` / `COMPLETED` — fulfillment status; mutated by
  shipment events in Stage 7.
- `CANCELLED` / `REFUNDED` — terminal failure / refund states.

## Customer order detail

Customers reading their own orders see everything except the redacted
`providerData` on the payment. The application service short-circuits with
`null` (the controller returns 404) when the order's `customerId` doesn't
match the requesting principal, so the access check is centralised, not
sprinkled into the controller.

## Domain events

Order-related events emitted:

- `order.placed` `{ orderId, customerId?, total, currency }`
- `order.cancelled` `{ orderId }` (wired but not currently fired by this
  module; reserved for the admin cancel flow).
- `payment.succeeded`, `payment.failed`, `refund.created` (see `payments.md`).
- `checkout.completed` `{ checkoutId, orderId }`.

## Layering

```
CheckoutController          (HTTP, idempotency, JwtAuthGuard for /orders)
   │
CheckoutApplicationService  (listOrders / getOrder helpers)
   │
OrderRepository             (Prisma; no validation)
```

The order surface intentionally lives under the checkout module — orders and
checkout share the same aggregate boundary. Splitting them would force
checkout to depend on an `orders` module that only exists to hold a single
repository. The structural saving is illusory.

## Out of scope (Stage 6)

- Admin order management UI.
- Order modifications (line edit, addr change).
- Multi-shipment splits.
- Returns and refunds end-to-end (foundation in place).
- Customer guest order lookup (email + order number).
