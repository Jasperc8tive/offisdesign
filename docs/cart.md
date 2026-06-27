# Cart

Guest and authenticated cart, sign-in merge, and live pricing via the
PromotionEngine. The cart never holds tax or shipping — those are checkout
concerns.

## Owner resolution

The CartController resolves an owner before any operation:

1. Inspect the access-token cookie (`offis_at`). If valid and `kind === 'customer'`,
   the owner is `customerId`.
2. Otherwise fall back to the anonymous cookie `offis_cart_anon`. The
   controller issues this cookie (UUIDv7, HttpOnly, SameSite=Lax, 30 d) when
   the request arrives without one.

The `Cart` row stores both `customerId?` and `anonymousId?`. An anonymous cart
becomes addressable by `anonymousId` and is merged into the customer cart on
sign-in.

## Endpoints (`/v1/cart`)

| Method | Path               | Notes                                                                   |
| ------ | ------------------ | ----------------------------------------------------------------------- | ------- |
| GET    | ``                 | Returns the active cart with derived totals; creates one on first visit |
| POST   | `items`            | Body `{ variantId, quantity }`. Quantity is additive.                   |
| PATCH  | `items/:variantId` | Body `{ quantity }`. `0` removes the line.                              |
| DELETE | `items/:variantId` | Remove                                                                  |
| DELETE | ``                 | Clear all items + coupon                                                |
| POST   | `coupon`           | `{ code: string                                                         | null }` |
| POST   | `merge`            | Called by the storefront after sign-in                                  |

All responses return a `CartView`: the cart row + items + computed
`subtotal`, `discount`, `total`, and `appliedDiscountIds` from the
PromotionEngine.

## Cart merge

`POST /v1/cart/merge` is idempotent:

1. Read the principal from the access cookie. If not a customer → no-op.
2. Read the anonymous id from the cart cookie. If missing → no-op.
3. Resolve / create the authenticated cart and the anonymous cart.
4. Same id (already merged) → no-op.
5. Otherwise sum line quantities from anonymous into the customer cart, clear
   the anonymous cart, mark it `ABANDONED`.
6. Clear the anonymous cookie.
7. Emit `cart.merged` `{ fromCartId, intoCartId, customerId }`.

Currency mismatch between the two carts → 400 `CURRENCY_MISMATCH`. The
merge logic preserves the customer cart's currency.

## Deterministic pricing

Every CartView round-trips through `PricingApplicationService.quote()`:

- Subtotal = sum of `unitAmount * quantity` per line.
- Discounts from the cart's `appliedCoupon` + currently-active auto-promos.
- The total is `quote.subtotal - quote.discount`.

Tax and shipping are explicitly **not** part of the cart. The storefront
should present the cart total without tax/shipping; checkout adds them.

## Optimistic concurrency

Every cart write goes through `withRetry(cartId, fn)` — up to 4 attempts. The
underlying `updateMany({ where: { id, version } })` returns count 0 on
conflict; the retry loop re-reads the row. Persistent conflict → 409
`STALE_VERSION`.

## Events emitted

`cart.created`, `cart.item-added`, `cart.item-removed`, `cart.cleared`,
`cart.merged`.

## Layering

```
CartController         (owner resolution, cookie handling)
   │
CartApplicationService (events + pricing quote)
   │
CartDomainService      (rules: status check, currency check, line merging)
   │
CartRepository         (Prisma)
```

## Out of scope (Stage 6)

- Save-for-later list (foundation present in the data model via cart status
  transitions, but no dedicated endpoint).
- Cross-device cart sync beyond cookie merge.
- Cart-level shipping rules (e.g. weight-based threshold) — sits in shipping
  layer.
