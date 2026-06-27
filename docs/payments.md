# Payments

Provider-agnostic payment abstraction. Stripe is the first concrete adapter;
adding new providers means implementing `PaymentService` and binding it via
the `PAYMENT_SERVICE` token.

## Provider boundary rule

> No payment provider SDK appears anywhere outside `apps/api/src/payments`.

The order, checkout, customer, and admin modules see only `PaymentService` and
its DTOs. This is enforced by structure: every `import Stripe` in the
codebase lives under `payments/`.

## `PaymentService`

```ts
interface PaymentService {
  provider: string;
  createIntent(input: CreateIntentInput): Promise<PaymentIntent>;
  confirm(providerRef: string): Promise<ConfirmedPayment>;
  refund(input: RefundInput): Promise<Refund>;
  parseWebhook(rawBody: Buffer, signature?: string): WebhookEvent;
}
```

- `createIntent` is **provider-idempotent**: Stripe accepts an
  `Idempotency-Key` and we pass `intent:<reference>` so retries reuse the
  same payment intent.
- `parseWebhook` verifies the signature inside the adapter. Controllers
  never touch raw provider state.
- DTOs are stripped of SDK noise (`lastResponse` etc.) before persistence so
  `Payment.providerData` is a clean JSON blob.

## Adapters

### StripePaymentService

- Requires `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`.
- Pinned to the SDK's default API version (no version override).
- `createIntent` uses `automatic_payment_methods: { enabled: true }`.
- `confirm` re-retrieves the intent (does not capture — Stripe captures
  automatically on `automatic_payment_methods`).
- `refund` is sent with `requested_by_customer` reason; metadata captures the
  free-text reason.
- `parseWebhook` calls `stripe.webhooks.constructEvent` — throws on invalid
  signature.

### MockPaymentService

- Default in development and tests (`PAYMENT_PROVIDER=mock`).
- `createIntent` returns an in-memory record; `confirm` succeeds for any
  intent we issued and fails (`unknown_intent`) for any other ref.
- `parseWebhook` is a no-op.

`PAYMENT_PROVIDER=stripe` is the only way to reach the real Stripe API —
prevents accidental charges in misconfigured environments.

## Webhook handling

`POST /v1/payments/webhook`:

1. The raw request body is captured by an Express `verify` hook gated to the
   webhook path (see `apps/api/src/main.ts`).
2. `PaymentService.parseWebhook` verifies the signature.
3. The event's `data.object.id` is the provider reference. We look up the
   matching `Payment` row by `(provider, providerRef)`. Unknown ref → 200 OK,
   no-op (typical for test traffic).
4. On `*.succeeded` events: update payment status to `CAPTURED`, persist the
   provider object, emit `payment.succeeded`.
5. On `*.failed` / `*.payment_failed`: status `FAILED`, emit `payment.failed`.
6. All paths return 200 to prevent provider retries on benign events.

## Persistence shape

The `Payment` row stores money as minor units + a `currency` column, plus the
full provider payload as `providerData jsonb`. This is the source of truth
for provider-specific state — reconciliation jobs read `providerData` rather
than re-pulling from the API.

## Refunds (foundation)

`PaymentService.refund({ providerRef, amount, reason? })` is implemented for
both Stripe and Mock adapters. The full refund workflow (order linkage,
inventory restock, customer notification) is deferred to Stage 7+.

Domain event `refund.created` is registered in `DomainEventMap` so the
emitter signature is ready.

## Events emitted

`payment.succeeded`, `payment.failed`, `refund.created` (when the refund flow
ships).

## Out of scope (Stage 6)

- Recurring payments / subscriptions.
- Saved payment methods.
- 3DS step-up handling beyond `requires_action` surfacing.
- Multi-capture / partial-capture orders.
- Currency conversion (single-currency launch).
