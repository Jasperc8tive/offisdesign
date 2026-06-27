# Inventory

Stock control across warehouses, with reservation/release/commit lifecycle and
optimistic concurrency.

## Aggregate

- `Warehouse` — physical or logical fulfillment location.
- `InventoryItem` — `(variantId, warehouseId)` is unique; tracks `onHand`,
  `reserved`, and an optimistic-concurrency `version`.
- `StockReservation` — `HELD → CONSUMED | RELEASED | EXPIRED`. Tied to a
  context (`contextType`, `contextId`) — e.g. a cart or an order.
- `StockAdjustment` — append-only ledger. Reason: `PURCHASE | SALE | RETURN |
COUNT | DAMAGE | TRANSFER`.

## Invariants

1. `available = onHand - reserved` and is always ≥ 0.
2. `onHand` cannot drop below `reserved` (would break inflight reservations).
3. Once a `StockAdjustment` row exists, it is never UPDATEd or DELETEd. The
   service layer enforces this; the database has no constraint expressing it.
4. Every state change on `InventoryItem` increments `version`.

## Operations

| Operation               | Effect on `onHand` | Effect on `reserved`    | Ledger row        | Event                       |
| ----------------------- | ------------------ | ----------------------- | ----------------- | --------------------------- |
| `adjust(delta, reason)` | +delta             | 0                       | `StockAdjustment` | `inventory.adjusted`        |
| `reserve(quantity)`     | 0                  | +quantity               | —                 | `inventory.reserved`        |
| `release(reservation)`  | 0                  | -quantity               | —                 | `inventory.released`        |
| `commit(reservation)`   | -quantity          | -quantity               | —                 | `inventory.committed`       |
| `expireStale()` cron    | 0                  | -quantity (per expired) | —                 | n/a (release event per row) |

All operations route through `InventoryDomainService.withRetry` (4 attempts)
to absorb optimistic-concurrency conflicts before surfacing 409.

## Optimistic concurrency

Every write executes as:

```ts
await prisma.inventoryItem.updateMany({
  where: { id, version: expectedVersion },
  data: { onHand: ..., reserved: ..., version: { increment: 1 } },
});
```

If `count === 0`, another writer mutated the row in between read and write.
The domain layer re-reads and retries up to 4 times; if all attempts lose,
the caller gets `409 STALE_VERSION`.

## Reservation lifecycle

```
        reserve()
              │
              ▼
            HELD ─── commit() ──► CONSUMED   (onHand -= qty, reserved -= qty)
              │
              ├── release() ───► RELEASED    (reserved -= qty)
              │
              └── (TTL elapsed) ─► EXPIRED   (cron releases first, then marks)
```

The reservation TTL is supplied per reservation (default 15 min). The
`reservation-cleanup` BullMQ queue ticks every 60 seconds and releases anything
past its `expiresAt`.

## REST endpoints (admin)

All under `/v1/admin/inventory`, behind `JwtAuthGuard + PermissionsGuard`.

| Method | Path                       | Permission        |
| ------ | -------------------------- | ----------------- |
| GET    | `warehouses`               | `inventory:read`  |
| POST   | `warehouses`               | `inventory:write` |
| PATCH  | `warehouses/:id`           | `inventory:write` |
| DELETE | `warehouses/:id`           | `inventory:write` |
| POST   | `adjust`                   | `inventory:write` |
| POST   | `reserve`                  | `inventory:write` |
| POST   | `reservations/:id/release` | `inventory:write` |
| POST   | `reservations/:id/commit`  | `inventory:write` |
| GET    | `items/:id/history`        | `inventory:read`  |

## Background jobs

- `reservation-cleanup` — repeating every 60s, calls `expireStale()`.

## Events emitted

`inventory.adjusted`, `inventory.reserved`, `inventory.released`,
`inventory.committed`.
