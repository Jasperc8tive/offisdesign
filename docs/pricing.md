# Pricing

Pricing engine: price calculation, compare-at, discounts/coupons, and a
promotion engine foundation. Checkout-specific discounting (cart abandon
promos, multi-step rules) is deferred to Stage 6+.

## Data model

`Discount` is the single source of truth for both auto-applied promotions and
coupon codes.

- `code` — when not null, the discount is gated by a coupon code (case-sensitive
  string, unique). When null, it's an auto-applied promotion.
- `kind` — `PERCENT` (basis points 0–10000) or `FIXED` (minor units; requires `currency`).
- `scope` — `CART`, `PRODUCT`, `COLLECTION`.
- `targetIds` — for `PRODUCT`/`COLLECTION`, the qualifying ids.
- `minSubtotal` — gate based on running subtotal (minor units).
- `startsAt` / `endsAt` — visibility window (null = unbounded).
- `usageLimit` / `usageCount` — counter for capping global usage.

`DiscountUsage` — ledger of consumed discounts, written by the application
layer when a quote becomes a cart/order commit. Not used inside `quote()`
itself (which is read-only).

## Promotion engine

`PromotionEngineService.apply(req, { active, byCode })` is a **pure function**
— no DB. The application service is responsible for loading the candidate set.

Apply order:

1. PRODUCT-scoped discounts (per-line). Best discount per line wins; ties
   broken by `id`.
2. COLLECTION-scoped discounts (per-line). Same rule.
3. CART-scoped discounts. Stack additively, capped at the running cart total.

Within each scope:

- Percent discounts use basis points: `floor(base * value / 10_000)`.
- Fixed discounts are denominated in their own currency; the engine skips
  any whose `currency` doesn't match the request `currency`.
- Discounts whose `usageLimit` is exhausted are ignored.

Output:

```ts
{ currency, lines: [{ variantId, unitAmount, quantity, lineSubtotal,
  lineDiscount, lineTotal }], subtotal, discount, total, appliedDiscountIds }
```

## REST endpoints (admin)

| Method | Path                              | Permission      |
| ------ | --------------------------------- | --------------- |
| GET    | `/v1/admin/pricing/discounts`     | `catalog:read`  |
| POST   | `/v1/admin/pricing/discounts`     | `catalog:write` |
| PATCH  | `/v1/admin/pricing/discounts/:id` | `catalog:write` |
| DELETE | `/v1/admin/pricing/discounts/:id` | `catalog:write` |
| POST   | `/v1/admin/pricing/quote`         | `catalog:read`  |

`POST /quote` accepts a line set + coupon codes and returns the computed quote.
This endpoint is used by the upcoming cart service in Stage 6.

## Compare-at pricing

`ProductVariant.compareAtAmount` is the strikethrough price for sale display.
The domain layer enforces `compareAtAmount > priceAmount` on create.
Compare-at is purely display — the engine ignores it.

## Out of scope (Stage 5)

- Cart-driven discount stacking rules (BOGO, tiered).
- Per-customer pricing.
- Multi-currency catalogue.
- Tax calculation (Stage 6+).
- Shipping calculation (Stage 6+).
