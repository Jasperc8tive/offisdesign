# Domain Events

In-process pub/sub backed by the persisted `domain_event` table.

## Why both in-process AND persisted?

- **Persisted** — every event written before listeners run, so audit and
  webhook outbox have a stable source of truth even if a listener crashes.
- **In-process** — synchronous listeners (cache invalidation, queue enqueue)
  fire immediately on publish for snappy reactivity.

The in-process dispatch is best-effort: handler failures are logged but do not
roll back the source transaction. Reliable downstream work is enqueued onto a
BullMQ queue (see `jobs/jobs.service.ts`) which has retries, backoff, and DLQ.

## EventBus

`apps/api/src/events/event-bus.service.ts`:

```ts
class EventBus {
  on<N extends DomainEventName>(name: N, handler: Handler<N>): void;
  publish<N extends DomainEventName>(
    name: N,
    aggregateType: string,
    aggregateId: string,
    payload: DomainEventMap[N],
    actorId?: string,
  ): Promise<void>;
}
```

`DomainEventMap` (in `domain-event.ts`) is the typed registry. Adding a new
event type means:

1. Add the entry to `DomainEventMap`.
2. Publish from the application service that owns the aggregate.
3. (Optional) Listen in `jobs.service.ts` to enqueue follow-up work.

## Registered events

| Name                  | Aggregate      | Payload                                                    | Publisher                                                  |
| --------------------- | -------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| `product.created`     | product        | `{ productId, slug }`                                      | `CatalogApplicationService.createProduct`                  |
| `product.updated`     | product        | `{ productId, slug }`                                      | `updateProduct`, variant ops                               |
| `product.published`   | product        | `{ productId, slug }`                                      | `publishProduct`, on create/update if transitioning        |
| `product.archived`    | product        | `{ productId, slug }`                                      | `archiveProduct`, on update if transitioning               |
| `product.deleted`     | product        | `{ productId, slug }`                                      | `deleteProduct`                                            |
| `collection.updated`  | collection     | `{ collectionId, slug }`                                   | `createCollection`, `updateCollection`, `deleteCollection` |
| `category.updated`    | category       | `{ categoryId, slug }`                                     | `createCategory`, `updateCategory`, `deleteCategory`       |
| `price.changed`       | variant        | `{ variantId, productId, oldAmount, newAmount, currency }` | `updateVariant` when `priceAmount` differs                 |
| `inventory.adjusted`  | inventory_item | `{ inventoryItemId, variantId, delta, reason }`            | `InventoryApplicationService.adjust`                       |
| `inventory.reserved`  | inventory_item | `{ ..., contextType, contextId, quantity }`                | `reserve`                                                  |
| `inventory.released`  | inventory_item | `{ ..., contextType, contextId, quantity }`                | `release`                                                  |
| `inventory.committed` | inventory_item | `{ ..., contextType, contextId, quantity }`                | `commit`                                                   |

## Wired listeners (Stage 5)

`apps/api/src/jobs/jobs.service.ts` registers in-process listeners that
**enqueue** background work:

- `product.created` → `search-index` queue (index).
- `product.updated` → `search-index` queue (index) + `cache-invalidate` queue
  (`cat:product:slug:<slug>`).
- `product.published` → `search-index` queue (index).
- `product.archived` / `product.deleted` → `search-index` queue (unindex).
- `collection.updated` → `cache-invalidate` queue
  (`cat:collection:slug:<slug>`).
- `category.updated` → `cache-invalidate` queue (`cat:category:tree`).

## Persistence

Every published event writes a `domain_event` row before listeners run.
Indexes: `(aggregate_type, aggregate_id)` and `(type, occurred_at)` for both
audit queries and webhook fan-out.

The outbound webhook dispatcher (planned for Stage 7) reads from this table
and signs deliveries with HMAC-SHA256 per the architecture rule.

## Reliability boundary

The synchronous in-process dispatch is the **fast path**, not the **reliable
path**. Anything that absolutely must happen reacts to the persisted row via
BullMQ (a future webhook outbox worker, or a more durable indexer). For now,
the queue layer is enough — search reindex and cache invalidation can both
tolerate at-least-once delivery.
