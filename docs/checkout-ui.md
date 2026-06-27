# Checkout UI

The checkout experience lives at `/checkout` and is composed from a small set of focused components in `apps/web/components/checkout/`.

## Step machine

`/checkout/page.tsx` drives a 4-step linear flow. The current step is local React state — there is no router-level routing per step, so the customer never has stale URLs to back into.

```
address → shipping → payment → review → confirmation
```

Transitions are gated on successful API calls — the customer cannot land on shipping until the address has been accepted by the server.

## Components

| File                       | Responsibility                                                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `step-indicator.tsx`       | Renders the 4-step `<ol>` with the current step highlighted and `aria-current="step"`.                                                                                  |
| `address-form.tsx`         | Reusable address form (also used by the address book). Country dropdown limited to supported markets. Optional "Billing same as shipping" toggle.                       |
| `shipping-method-step.tsx` | Radio group of `ShippingRate` cards keyed by carrier/service.                                                                                                           |
| `payment-step.tsx`         | Provider-neutral wrapper. Mounts Stripe `<Elements>` + `<PaymentElement>` when a `clientSecret` is present; otherwise falls back to a "mock payment" CTA for local dev. |
| `review-step.tsx`          | Read-only summary with `Edit` links back to earlier steps and a `Place order` button.                                                                                   |
| `order-summary.tsx`        | Sticky summary card on the right rail across every step. Accepts optional `shippingAmount`, `taxAmount`, `total` overrides for the post-quote review step.              |

## Data flow

```
useStartCheckout()      → POST /v1/checkout
useSetShippingAddress() → POST /v1/checkout/:id/shipping-address
useShippingRates()      → GET  /v1/checkout/:id/shipping-rates
useSetShippingMethod()  → POST /v1/checkout/:id/shipping-method
useReviewCheckout()     → POST /v1/checkout/:id/review     (server-computed totals + tax quote)
useCreatePaymentIntent()→ POST /v1/checkout/:id/payment-intent
usePlaceOrder()         → POST /v1/checkout/:id/place      (idempotency-key required)
```

All hooks live in `apps/web/lib/hooks/checkout.ts` and all wire-format types are validated by Zod schemas in `apps/web/lib/api/schemas.ts`.

## Identity modes

- **Guest** — the customer enters an email above the address form; that email becomes the order contact.
- **Authenticated** — `useAuth()` hydrates the email automatically; the field is hidden.
- **Login during checkout** — the existing `/account/login` page is linked from the contact section; on success the customer is redirected back to `/checkout` and the in-flight session id is preserved.

## Address book integration

Future enhancement: pre-fill `shippingAddress` from `useAddresses()` when the customer is authenticated. The data plumbing already exists via the address service — only the UI affordance is pending.

## Confirmation

`/checkout/[id]/confirmation` reads the order via `useOrder(orderId)` and renders a thank-you summary. On mount it dispatches the `purchase_confirmed` analytics event and clears the local cart cache.

## Analytics

Each step transition fires `checkout_step_viewed` with the destination step name. Order placement fires `purchase { orderId, value, currency }`. The confirmation page fires `purchase_confirmed { orderId }` exactly once per order.
