# Operations

Feature flags, system settings, maintenance mode, cache management, audit,
and the cron fleet. The operational seams that let the platform run
without code changes.

## Feature flags

`FeatureFlag` row: `{ key, name, enabled, rolloutPct (0–100), config? }`.

- `enabled === false` → permanently off.
- `rolloutPct >= 100` → on for everyone.
- Otherwise, `FeatureFlagService.isEnabled(key, subjectId)` hashes
  `key:subjectId` with SHA-256 and buckets the first 4 bytes into `0–99`;
  the flag is on iff `bucket < rolloutPct`.

This is **deterministic per (key, subject)**, so the same user keeps the
same experience across requests until the flag changes. A subject id of
`undefined` always evaluates `false` for `rolloutPct < 100` — anonymous
users only see fully-rolled-out features.

Admin endpoints: `GET/POST/PATCH/DELETE /v1/admin/ops/flags`. Evaluation
debugging via `GET /v1/admin/ops/flags/:key/evaluate/:subject`.

## System settings

Key-value store, namespaced by dot (`commerce.shipping.freeThreshold`,
`seo.defaultMeta`, `support.email`). Two flavours:

- **Public** (`isPublic = true`) — served at `/v1/storefront/ops/settings`
  for the storefront's bootstrap snapshot.
- **Private** — admin-only via `/v1/admin/ops/settings`.

Updates go through `SystemSetting.upsert` and stamp `updatedBy`.

## Maintenance mode

A specialised public setting at key `system.maintenance`:

```json
{ "enabled": true, "message": "Back at 14:00 UTC", "since": "2026-03-15T13:00:00Z" }
```

Surfaced by `GET /v1/storefront/ops/maintenance` so the storefront can render
a degraded page without an API roundtrip per feature. Admins toggle via
`POST /v1/admin/ops/maintenance`. The middleware that _enforces_ the mode
(blocking writes, returning 503) lands when storefront is wired in a later
stage — the data is here for the storefront to inspect now.

## Cache management

| Endpoint                                                 | Effect                                    |
| -------------------------------------------------------- | ----------------------------------------- |
| `POST /v1/admin/ops/cache/invalidate { keys: string[] }` | `cache.del` each key                      |
| `POST /v1/admin/ops/cache/flush`                         | `redis.flushdb()` — nuclear, audit-logged |

Permission `system:audit` is required for both. Flush is logged via
ActivityService through the standard middleware.

## Audit & activity

Two services:

- `RevisionService` — append-only `content_revision` rows. Each `record()`
  call resolves the next `version` per `(aggregateType, aggregateId)`, stores
  the full snapshot, and computes a shallow diff against the previous version.
- `ActivityService` — `admin_activity_log` rows. The application service
  pulls `actorId`, `ipAddress`, `userAgent` from the request context
  (`AsyncLocalStorage`) so feature code only supplies the action name and
  optional aggregate metadata.

Admin endpoints under `/v1/admin/audit/*` (permission `system:audit`):

- `activity` — paginated, filterable.
- `revisions/:aggregateType/:aggregateId` — all versions descending.
- `revisions/:aggregateType/:aggregateId/:version` — single snapshot.

CMS restore (`POST /v1/admin/cms/pages/:id/restore/:version`) reads a
snapshot via `RevisionService.getOrThrow` and replays it through the
regular page update — so concurrency conflicts and slug rules still apply.

## Cron fleet

Registered by `JobsService.onModuleInit`:

| Queue                   | Cadence | Purpose                                        |
| ----------------------- | ------- | ---------------------------------------------- |
| `reservation-cleanup`   | 60 s    | Release stale inventory reservations           |
| `checkout-cleanup`      | 5 min   | Expire stale checkout sessions                 |
| `abandoned-cart-scan`   | 1 h     | Count inactive ACTIVE carts (foundation)       |
| `payment-reconcile`     | 10 min  | Count stuck PENDING payments (foundation)      |
| `scheduled-publish`     | 60 s    | Auto-publish/unpublish CMS pages + blog posts  |
| `webhook-dispatch`      | 30 s    | Send pending outbound webhooks                 |
| `notification-delivery` | 30 s    | Send pending notifications                     |
| `media-cleanup`         | 24 h    | Purge storage for media soft-deleted ≥ 7 d ago |

All are BullMQ repeating jobs with stable `jobId`s so restart doesn't
duplicate the schedule. Failure handling (retries, DLQ) is the default
queue policy from Stage 4.

## RBAC at a glance

Every operational endpoint is behind `JwtAuthGuard + PermissionsGuard`. The
permission set added in Stage 7:

- `system:read` — flags, settings, maintenance, deliveries, activity reads.
- `system:audit` — flags/settings mutations, cache flush, webhook secret
  rotation, replay, notification template authoring.

Feature-stage developers don't need new permissions for catalog/CMS — those
were seeded at Stage 4.

## Out of scope (Stage 7)

- Auto-rollback when a feature flag's error rate spikes.
- Built-in maintenance-mode middleware (data layer ships now; storefront
  enforcement later).
- Audit log retention policy / archival to cold storage.
- Tenant-aware flags (single-tenant launch).
