# Checkout

A `CheckoutSession` is the state machine that takes a Cart from "shopper has
items" to "order placed". The session is the idempotency anchor for the
whole flow.

## State machine

```
        start
          │
          ▼
       PENDING ──── place ────► COMPLETED
          │                       (with orderId)
          ├── payment-intent ───► AWAITING_PAYMENT
          │                            │
          │                          place
          │                            ▼
          │                       COMPLETED
          │
          ├── cron expire ───────► EXPIRED
          │
          └── cancel ─────────────► CANCELLED
```

- **TTL** — `CHECKOUT_TTL_MIN` (default 30 minutes) from creation.
- **EXPIRED** is set by the `checkout-cleanup` cron (every 5 min). It releases
  every reservation attached to the session before marking the row.
- **COMPLETED** is the only terminal success — sets `orderId`.

## Endpoints (`/v1/checkout`)

| Method | Path                   | Notes                                                               |
| ------ | ---------------------- | ------------------------------------------------------------------- |
| POST   | ``                     | Body `{ email }`. Starts/resumes the session for the current cart.  |
| POST   | `:id/shipping-address` | Persists the shipping address JSON.                                 |
| POST   | `:id/billing-address`  | Persists the billing address JSON.                                  |
| GET    | `:id/shipping-rates`   | Pulls rates from the ShippingService.                               |
| POST   | `:id/shipping-method`  | Persists the chosen method + amount.                                |
| POST   | `:id/review`           | Computes & persists totals via Pricing + Tax.                       |
| POST   | `:id/payment-intent`   | Creates / re-uses a payment intent via PaymentService.              |
| POST   | `:id/place`            | Idempotent (`Idempotency-Key` header). Runs the placement pipeline. |
| GET    | `orders`               | Customer's order list (auth)                                        |
| GET    | `orders/:id`           | Customer's order detail (auth)                                      |

## Placement pipeline

`POST /:id/place` runs as:

1. **Idempotency check.** The controller routes through `IdempotencyService` —
   the same `Idempotency-Key` + same body returns the stored response; same
   key + different body returns 409 `IDEMPOTENCY_MISMATCH`.
2. **Validate** — session exists; cart non-empty; shipping address set;
   payment intent set.
3. **Reserve stock** — for every cart line, call `InventoryApplicationService.reserve`
   on the default warehouse (`DEFAULT_WAREHOUSE_CODE`). Reservation ids are
   stored on the session.
4. **Confirm payment** — re-fetch the intent via `PaymentService.confirm`. If
   not `succeeded`, release the reservations and surface 400 `PAYMENT_NOT_SUCCEEDED`
   with the provider's failure reason. Emit `payment.failed`.
5. **Create order** in a single Prisma transaction:
   - `Order` row (status `PAID`, `placedAt = now()`).
   - `OrderItem` rows from the cart lines.
   - `Payment` row with the provider's raw confirmation persisted in
     `providerData`. Status `CAPTURED`.
   - `OrderEvent` `OrderPlaced` ledger row.
6. **Commit reservations** — `InventoryApplicationService.commit` for each
   reservation id. Decrements both `onHand` and `reserved` on the InventoryItem.
7. **Clear cart** — mark the cart `CHECKED_OUT` and the session `COMPLETED`.
8. **Emit events** — `payment.succeeded`, `order.placed`, `checkout.completed`.

A second `place` call for the same session short-circuits to the existing
order — idempotency is a property of both the explicit `Idempotency-Key` and
the session's `COMPLETED` state.

## Failure isolation

- Payment failure → reservations released, no order, 400.
- Inventory failure before payment → 409, no money moved.
- Inventory commit failure after payment → order persists; commit is
  retried by the inventory cron. We deliberately do **not** roll back the
  order because the payment has already cleared.
- Transaction scope is the order persistence step only. Inventory and payment
  side effects are out-of-band so a partial failure leaves a recoverable
  state, not a lost order.

## Idempotency

`IdempotencyService.run(key, request, statusCode, factory)` persists the first
result keyed by `key` + SHA-256 of the body. The row has a 24-hour TTL.

The default key, when the client omits the `Idempotency-Key` header, is
`auto:<checkoutId>:place` — sufficient for naive retry storms but real
clients should send a fresh UUID per attempt.

## Layering

```
CheckoutController  (HTTP + idempotency wrapper)
   │
CheckoutApplicationService  (pipeline orchestration, events, cross-module calls)
   │
CheckoutDomainService       (state transitions, optimistic concurrency)
   │
CheckoutRepository          (Prisma)
```

## Out of scope (Stage 6)

- Guest order lookup by email + order number.
- Order modifications post-placement (refund/cancel flows are in `payments.md`).
- Multi-shipment splits.
- Promo "auto-apply best coupon" UX.
