# Event Model

Stage 3 catalogue of **domain events**: their names, payload outlines,
producers, consumers, delivery semantics, and how they relate to the inbound
webhooks (`Webhook` / `WebhookDelivery`) defined in `prisma-schema-design.md`
§11.5–11.6.

This document is a contract. Once an event ships, its name, version, and the
shape of its `data` field follow semver-compatible evolution rules (§9).

---

## 1. Goals

- Decouple bounded contexts: a write in Catalog should not synchronously call
  into Inventory or Notifications.
- Provide a single feed that powers queues (BullMQ jobs), in-process listeners,
  outbound `Webhook` delivery, analytics, and future integrations.
- Stay simple at launch: in-process bus + Redis queue. No Kafka / NATS yet.
- Be testable: events are plain data, easy to assert on.

---

## 2. Architecture

```
   Producer (service inside apps/api)
            │
            │  publishes via EventBus.publish(event)
            ▼
   ┌────────────────────────────────┐
   │ In-process EventBus            │
   │ - sync handlers (same TX scope)│
   │ - async handlers (enqueue)     │
   └─────────────┬──────────────────┘
                 │
   ┌─────────────┼──────────────────────────────┐
   │             │                              │
   ▼             ▼                              ▼
 Sync handlers  Async handlers              Webhook dispatcher
 (audit log,    (queued via BullMQ:         (matches event type to
  search index, notifications, search       subscribed `Webhook` rows;
  cache warm)  reindex, etc.)               writes WebhookDelivery)
                 │
                 ▼
            Workers (separate process)
```

Rules:

- **Sync handlers** run inside the producing transaction. They must be cheap
  and side-effect-safe within DB scope (e.g. write an `AuditLog` row).
- **Async handlers** run after the TX commits. They are enqueued in BullMQ and
  consumed by workers. They never see uncommitted state.
- **Outbound webhooks** are async; never block the producer.

---

## 3. Event Envelope

Every event — internal and webhook — uses the same envelope.

```ts
type DomainEvent<TData> = {
  id: string; // UUIDv7, generated at publish
  type: string; // e.g. "order.placed"
  version: number; // 1 at launch; bumped on breaking shape change
  occurredAt: string; // ISO 8601 UTC
  producer: {
    service: string; // "api"
    module: string; // "orders"
  };
  actor?: {
    type: 'Customer' | 'AdminUser' | 'System';
    id?: string;
  };
  requestId?: string; // correlation with HTTP request
  data: TData;
};
```

`type` is dot-namespaced: `<context>.<noun>.<past-tense-verb>` where useful.

---

## 4. Delivery Semantics

- **At-least-once** to async handlers and webhooks. Handlers must be
  idempotent — use `event.id` as the dedup key.
- **Ordering** is **not guaranteed** across event types. Within a single
  aggregate (e.g. one order), workers can serialise by `data.<aggregate>Id`
  if order matters; documented per consumer.
- **Retries**: BullMQ retries with exponential backoff (1m, 5m, 30m, 2h, 12h, 1d).
  Webhooks follow the same schedule (`api-conventions.md` §19).
- **Dead-letter**: after final attempt, jobs land on a DLQ; webhook deliveries
  transition to `Abandoned`. Both surface in `/v1/admin/platform/...` lists.

---

## 5. Event Catalogue

Each entry below lists: producer module · consumers · delivery (sync/async) ·
outbound webhook flag · `data` payload outline. Payloads are structural — the
actual Zod schemas are written in Stage 6+ alongside the producing service.

Legend: **(S)** sync handler, **(A)** async handler, **(W)** webhook-eligible.

### 5.1 Identity

| Event                             | data                                                      |
| --------------------------------- | --------------------------------------------------------- |
| `customer.registered` (A, W)      | `{ customerId, email, isGuest }`                          |
| `customer.email_verified` (A, W)  | `{ customerId }`                                          |
| `customer.password_changed` (A)   | `{ customerId }`                                          |
| `customer.suspended` (A, W)       | `{ customerId, reason? }`                                 |
| `customer.deleted` (A)            | `{ customerId }`                                          |
| `customer.login_succeeded` (A)    | `{ customerId, sessionId }`                               |
| `customer.login_failed` (S)       | `{ email, reason }` → triggers rate-limit/account-locking |
| `admin.user_created` (S, A)       | `{ adminUserId, email, roleKeys }`                        |
| `admin.user_roles_changed` (S, A) | `{ adminUserId, before, after }`                          |
| `admin.login_succeeded` (A)       | `{ adminUserId, sessionId, ip }`                          |
| `admin.login_failed` (S)          | `{ email, reason, ip }`                                   |

- Sync consumers: `AuditLog` writer, security counters.
- Async consumers: welcome email, verification email reminder, audit forwarder.

### 5.2 Catalog

| Event                      | data                                                         |
| -------------------------- | ------------------------------------------------------------ |
| `product.created` (A, W)   | `{ productId, slug, status }`                                |
| `product.updated` (A, W)   | `{ productId, changedFields[] }`                             |
| `product.published` (A, W) | `{ productId, slug }`                                        |
| `product.archived` (A, W)  | `{ productId }`                                              |
| `product.deleted` (A, W)   | `{ productId }`                                              |
| `variant.created` (A, W)   | `{ productId, variantId, sku?, priceAmount, priceCurrency }` |
| `variant.updated` (A, W)   | `{ variantId, changedFields[] }`                             |
| `variant.deleted` (A, W)   | `{ variantId }`                                              |
| `collection.updated` (A)   | `{ collectionId }`                                           |
| `category.updated` (A)     | `{ categoryId }`                                             |

- Sync: cache invalidation tags (`product:<id>`, `slug:<slug>`).
- Async: search reindex, sitemap regeneration, image variant warmup.

### 5.3 Inventory

| Event                                 | data                                                             |
| ------------------------------------- | ---------------------------------------------------------------- |
| `inventory.item_created` (A)          | `{ inventoryItemId, warehouseId, variantId }`                    |
| `inventory.adjusted` (A, W)           | `{ inventoryItemId, delta, reason, onHandAfter, reservedAfter }` |
| `inventory.low_stock` (A, W)          | `{ inventoryItemId, variantId, onHand, threshold }`              |
| `inventory.reservation_created` (A)   | `{ reservationId, inventoryItemId, qty, ttl }`                   |
| `inventory.reservation_released` (A)  | `{ reservationId, reason }`                                      |
| `inventory.reservation_committed` (A) | `{ reservationId, orderLineId }`                                 |
| `inventory.reservation_expired` (A)   | `{ reservationId }` — emitted by a background sweep              |

- Sync: stock-adjustment ledger row (written in same TX as the inventory write).
- Async: low-stock notifications, replenishment alerts, search facet refresh.

### 5.4 Cart

| Event                     | data                                                           |
| ------------------------- | -------------------------------------------------------------- | ----------------------------- |
| `cart.created` (A)        | `{ cartId, ownerType: "Customer"                               | "Guest", ownerId, currency }` |
| `cart.item_added` (A)     | `{ cartId, variantId, qty }`                                   |
| `cart.item_updated` (A)   | `{ cartId, variantId, qty }`                                   |
| `cart.item_removed` (A)   | `{ cartId, variantId }`                                        |
| `cart.coupon_applied` (A) | `{ cartId, code }`                                             |
| `cart.coupon_removed` (A) | `{ cartId }`                                                   |
| `cart.merged` (A, W)      | `{ sourceCartId, destinationCartId, customerId, mergedItems }` |
| `cart.abandoned` (A)      | `{ cartId, lastActivityAt }` — emitted by sweep job            |
| `cart.converted` (A)      | `{ cartId, orderId }`                                          |

- Sync: none beyond writing the cart rows.
- Async: abandoned-cart email sequence, analytics events, recommendations refresh.

### 5.5 Checkout & Orders

| Event                             | data                                                                  |
| --------------------------------- | --------------------------------------------------------------------- |
| `order.placed` (S, A, W)          | `{ orderId, humanRef, customerId, totalAmount, currency, lineCount }` |
| `order.updated` (A, W)            | `{ orderId, changedFields[] }`                                        |
| `order.cancelled` (A, W)          | `{ orderId, reason?, actor }`                                         |
| `order.completed` (A, W)          | `{ orderId }`                                                         |
| `payment.initiated` (A)           | `{ paymentId, orderId, provider, amount, currency }`                  |
| `payment.requires_action` (A)     | `{ paymentId, orderId, providerPaymentId, clientSecret? }`            |
| `payment.succeeded` (S, A, W)     | `{ paymentId, orderId, amount, currency }`                            |
| `payment.failed` (A, W)           | `{ paymentId, orderId, code?, reason? }`                              |
| `payment.refund.created` (A, W)   | `{ refundId, paymentId, amount, currency, reason? }`                  |
| `payment.refund.succeeded` (A, W) | `{ refundId, paymentId }`                                             |
| `payment.refund.failed` (A, W)    | `{ refundId, paymentId, code?, reason? }`                             |
| `shipment.created` (A, W)         | `{ orderId, shipmentId, lineCount }`                                  |
| `shipment.shipped` (A, W)         | `{ orderId, shipmentId, carrier?, trackingNumber? }`                  |
| `shipment.delivered` (A, W)       | `{ orderId, shipmentId }`                                             |

Sync consumers on `order.placed`:

- Reserve→commit transition (handled in-TX by OrdersService),
- Coupon redemption counter increment,
- `AuditLog`.

Async consumers:

- Order confirmation email,
- Receipt PDF generation,
- Analytics conversion event,
- Webhook delivery.

### 5.6 Promotions

| Event                    | data                                                      |
| ------------------------ | --------------------------------------------------------- |
| `coupon.redeemed` (A, W) | `{ couponId, code, orderId, customerId?, amountApplied }` |
| `coupon.exhausted` (A)   | `{ couponId, code }` — when `maxUses` hit                 |

### 5.7 Customer Engagement

| Event                         | data                                          |
| ----------------------------- | --------------------------------------------- |
| `wishlist.item_added` (A)     | `{ customerId, productId }`                   |
| `wishlist.item_removed` (A)   | `{ customerId, productId }`                   |
| `review.submitted` (A, W)     | `{ reviewId, customerId, productId, rating }` |
| `review.published` (A, W)     | `{ reviewId, productId, rating }`             |
| `review.rejected` (A)         | `{ reviewId, reason }`                        |
| `newsletter.subscribed` (A)   | `{ email, customerId?, status }`              |
| `newsletter.confirmed` (A)    | `{ email, customerId? }`                      |
| `newsletter.unsubscribed` (A) | `{ email }`                                   |

Async consumers: notify admin for moderation queue, recompute product
aggregates (avg rating, review count) via a debounced job.

### 5.8 Content (CMS)

| Event                        | data                                 |
| ---------------------------- | ------------------------------------ |
| `page.published` (A)         | `{ pageId, slug, locale, template }` |
| `page.unpublished` (A)       | `{ pageId }`                         |
| `page.updated` (A)           | `{ pageId, changedFields[] }`        |
| `blog_post.published` (A, W) | `{ blogPostId, slug }`               |
| `media.uploaded` (A)         | `{ mediaId, kind, byteSize }`        |
| `media.variants_ready` (A)   | `{ mediaId, variants[] }`            |

Async consumers: ISR revalidation hook on `apps/web`, sitemap regen.

### 5.9 Platform

| Event                            | data                                           |
| -------------------------------- | ---------------------------------------------- |
| `audit.entry_created` (S)        | `{ auditLogId, entityType, entityId, action }` |
| `setting.updated` (A)            | `{ key, oldValue, newValue }`                  |
| `feature_flag.updated` (A)       | `{ key, audience }`                            |
| `webhook.delivery_failed` (A)    | `{ webhookId, deliveryId, attempt, status }`   |
| `webhook.delivery_abandoned` (A) | `{ webhookId, deliveryId }`                    |
| `background_job.failed` (A)      | `{ jobId, queue, name, attempts }`             |

---

## 6. Webhook Subscription Surface

The set of event types subscribable via `Webhook.events` at launch is the
**(W)-flagged** subset of §5. Subscribers may choose:

- Specific types (`order.placed`, `payment.succeeded`),
- Type prefixes (`order.*`, `payment.*`),
- `*` (all subscribable events) — discouraged but allowed.

Deliveries:

- HTTP POST with the envelope from §3.
- Signed per `api-conventions.md` §19 (`X-Webhook-Signature`).
- Retry schedule per §4.

Events **not** webhook-eligible (internal-only) include audit, feature-flag,
setting, login_failed, password_changed — they're security-sensitive or
high-volume.

---

## 7. Producer Rules

- **One canonical producer per event.** No fan-out producers.
- Events are published from the **service layer only**, never from controllers.
- For aggregates with multiple changes in one TX, publish a single
  `*.updated` event with `changedFields[]` rather than one event per column.
- Sync handlers may only do work that is safe to roll back with the producing
  TX (DB writes, log lines). Anything external is async.

---

## 8. Consumer Rules

- **Idempotent.** Re-running a handler with the same `event.id` produces the
  same end state.
- **No back-references** to producers' internal types — consumers depend on
  the event envelope and `data` shape only.
- **Failures are observable**: failed jobs persist with their failure reason;
  the `/v1/admin/platform/background-jobs` and `/webhook-deliveries`
  endpoints surface them.
- **Bounded work per event**: each handler does one thing. Fan-out via the
  bus, not within a handler.

---

## 9. Versioning & Evolution

- `version: 1` at launch for every event.
- **Backward-compatible changes** (no version bump): adding optional fields,
  adding a new event type, adding a new enum value (consumers must tolerate
  unknown values).
- **Breaking changes** (bump `version`): removing a field, renaming a field,
  changing a field's type or semantics, removing an event type.
- When a breaking change ships, both versions are emitted in parallel for a
  documented deprecation window (default 90 days). Subscribers select a
  version per webhook (future field on `Webhook`).
- The event catalogue is a versioned doc: each PR that changes events updates
  this file and adds an ADR entry under `docs/adr/`.

---

## 10. Examples (illustrative shapes)

`order.placed`:

```json
{
  "id": "01J9ZK...",
  "type": "order.placed",
  "version": 1,
  "occurredAt": "2026-07-01T18:22:09.143Z",
  "producer": { "service": "api", "module": "orders" },
  "actor": { "type": "Customer", "id": "01J9..." },
  "requestId": "req_01J9...",
  "data": {
    "orderId": "01J9...",
    "humanRef": "OFD-2026-0001",
    "customerId": "01J9...",
    "totalAmount": 24900,
    "currency": "USD",
    "lineCount": 2
  }
}
```

`inventory.adjusted`:

```json
{
  "id": "01J9ZL...",
  "type": "inventory.adjusted",
  "version": 1,
  "occurredAt": "2026-07-01T18:22:09.180Z",
  "producer": { "service": "api", "module": "inventory" },
  "actor": { "type": "System" },
  "data": {
    "inventoryItemId": "01J9...",
    "delta": -2,
    "reason": "order",
    "onHandAfter": 8,
    "reservedAfter": 0
  }
}
```

---

## 11. What This Document Does Not Cover

- Concrete BullMQ queue names, concurrency, and rate caps — Stage 6 (Workers).
- Analytics destination (PostHog/Plausible/etc.) — Stage 13.
- A formal event-store / outbox table — deliberately deferred. Launch uses
  the in-process bus + queue with at-least-once semantics; an outbox is added
  if cross-service durability ever requires it.
