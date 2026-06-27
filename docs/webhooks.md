# Webhooks

Outbound delivery of persisted `DomainEvent` rows to subscriber URLs, with
HMAC signing, retry backoff, replay, and secret rotation.

## Subscriber model

`Webhook` row keys:

- `url` — fully-qualified delivery URL.
- `events` — array of event names the subscriber is interested in
  (e.g. `["order.placed", "payment.succeeded"]`).
- `secret` — `whsec_…` HMAC secret. Generated on create; rotated by API.
- `isActive` — global on/off switch.

## Lifecycle

1. The application service publishes a `DomainEvent` row (Stage 4 wired
   this); `EventBus.publish()` writes to `domain_event` before in-process
   dispatch.
2. In-process listeners in `JobsService` call `WebhooksAppService.fanOut(eventId, type)`
   which creates one `WebhookDelivery` row per matching subscriber in `PENDING`.
3. The `webhook-dispatch` BullMQ cron (30 s) calls `dispatchPending()`:
   reads up-to-100 pending rows, signs each event payload with the
   subscriber's secret, POSTs to the URL with these headers:

   | Header            | Purpose                                                 |
   | ----------------- | ------------------------------------------------------- |
   | `Offis-Signature` | `t=<unix>,v1=<hex-hmac-sha256>` over `<unix>.<payload>` |
   | `Offis-Event`     | The event name                                          |
   | `Offis-Delivery`  | The `WebhookDelivery.id` for log correlation            |

4. HTTP 2xx → `WebhookDelivery.status = SUCCESS`, `deliveredAt` set.
5. Non-2xx or fetch error → `recordFailure` schedules the next attempt
   per the backoff schedule below, or marks `FAILED` after the cap.

## Signature scheme

Mirrors Stripe's: signs `<unix>.<payload>` with HMAC-SHA256 so a replay
against a different timestamp fails. Receivers verify with:

```ts
const expected = hmacSha256(secret, `${t}.${rawBody}`);
timingSafeEqual(expected, parsed.v1);
```

Optional `maxAgeSec` rejects stale timestamps. The signing helpers live in
`apps/api/src/webhooks/hmac.ts` and ship with `signPayload` +
`verifySignature` for SDK consumers.

## Retry schedule

Capped at 6 attempts; the row transitions to permanent `FAILED` after the
last fail. Backoff delays for the first 5 attempts:

| Attempt | Delay  |
| ------- | ------ |
| 1 → 2   | 1 min  |
| 2 → 3   | 5 min  |
| 3 → 4   | 15 min |
| 4 → 5   | 1 h    |
| 5 → 6   | 6 h    |

Failures record `lastError` (HTTP status code or fetch error message) so
admins can triage from the delivery log.

## Replay

`POST /v1/admin/webhooks/deliveries/:id/replay` resets the row to `PENDING`
with `nextAttemptAt = null` — the next dispatch tick reattempts immediately.

## Secret rotation

`POST /v1/admin/webhooks/:id/rotate-secret` generates a fresh `whsec_…` and
updates the row. Existing pending deliveries will sign with the new secret
on next attempt. There is no overlap window in Stage 7 — feature stages add
multi-secret rolling rotation if the subscriber base needs it.

## Endpoints (admin)

| Method | Path                             | Permission     |
| ------ | -------------------------------- | -------------- |
| GET    | `webhooks`                       | `system:audit` |
| POST   | `webhooks`                       | `system:audit` |
| PATCH  | `webhooks/:id`                   | `system:audit` |
| DELETE | `webhooks/:id`                   | `system:audit` |
| POST   | `webhooks/:id/rotate-secret`     | `system:audit` |
| GET    | `webhooks/:id/deliveries`        | `system:audit` |
| POST   | `webhooks/deliveries/:id/replay` | `system:audit` |

## Wired triggers

`JobsService` listens for these events and calls `fanOut`:

- `order.placed`
- `payment.succeeded`
- `payment.failed`

Adding a new dispatched event is a one-line listener change — the subscriber
filter on `events: { has: type }` does the rest.

## Out of scope (Stage 7)

- Per-subscriber rate limits.
- Per-subscriber JWT bearer auth (in addition to HMAC).
- Outbox table separate from `domain_event` (the domain event itself is the
  outbox).
- Multi-secret rolling rotation window.
