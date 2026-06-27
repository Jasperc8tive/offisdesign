# Cart UI

The shopping cart page (`/cart`) is the storefront's last surface before checkout. It is implemented in `apps/web/app/(shop)/cart/page.tsx`.

## Architecture

The page is a **client component** because it depends on the React Query–backed `CartProvider`. It composes presentation-only `@offisdesign/ui` primitives (`Grid`, `Cluster`, `Stack`, `PriceTag`, `Quantity`, `Alert`, `EmptyState`, `FormField`, `Input`, `Button`). There is no business logic in this file — every mutation flows through `useCart()` which calls `cartService` against `/v1/cart`.

## Data flow

```
CartProvider (lib/providers/cart.provider.tsx)
   └── cartService.{get, addItem, updateItem, removeItem, applyCoupon}  (apps/web/lib/api/services/cart.ts)
         └── /v1/cart  (NestJS CartModule — totals + coupon resolution computed server-side)
```

The provider applies optimistic updates against the `['cart', 'current']` query key so badges in the header update before the network round-trip completes.

## States

- **Loading** — renders a muted "Loading cart…" text.
- **Empty** — renders `<EmptyState>` with a "Start browsing" CTA back to `/`.
- **Active** — two-column grid: line items on the left, sticky order summary on the right.

## Coupon entry

The summary aside contains a coupon form. Submission calls `applyCoupon(code)`; success shows a toast and clears the input. When a coupon is already applied, the form is replaced with a success `<Alert>` that exposes a "Remove" button which calls `applyCoupon(null)`.

Errors surface as a small inline `<Text tone="primary">` under the input — `ApiError.is(err)` is used so server-defined messages (e.g. `COUPON_NOT_FOUND`, `COUPON_EXPIRED`) are passed through.

## Totals

Subtotal, discount, and total are taken directly from the server cart view (`subtotal`, `discount`, `total`). Shipping and tax show "calculated at checkout" copy — they are not estimated client-side.

## Continue shopping

A ghost "Continue shopping" button below the items returns the customer to `/`. The "Checkout" button (full-width, large, in the aside) navigates to `/checkout`.

## Accessibility

- Cart items live inside `<section aria-label="Cart items">`; the summary uses `<aside aria-label="Order summary">`.
- The remove-item button has an explicit `aria-label="Remove item"`.
- Inputs are wrapped in `<FormField>`, which renders an associated `<label>` and `aria-describedby` for error text.
