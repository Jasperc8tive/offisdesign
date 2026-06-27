# Backend Foundation (Stage 4)

The platform layer that every feature stage builds on. No business features
yet — only the substrate.

## Stack at a glance

- **API runtime**: NestJS 10 on Node 20 (Express adapter, helmet, CORS).
- **Database**: PostgreSQL 16, accessed via Prisma (`@offisdesign/database`).
- **Cache / sessions / refresh tokens / rate-limit / queue backplane**: Redis 7.
- **Background jobs**: BullMQ — infrastructure only, no jobs registered yet.
- **Storage**: pluggable driver (`@offisdesign/storage`), local FS or S3-compatible.
- **Validation**: Zod for env + request bodies (`ZodValidationPipe`).
- **Logger**: pino + nestjs-pino, redaction on by default, request-id correlation.
- **Auth**: JWT access + refresh (rotation), HttpOnly cookies, bcrypt passwords.
- **RBAC**: roles/permissions in DB + `@RequirePermissions(...)` + `PolicyService`.
- **OpenAPI**: served at `GET /docs` when `OPENAPI_ENABLED=true`.

## Directory layout

```
apps/api/src/
├── app.module.ts          // Wires every infra module + global filters/guards
├── main.ts                // Bootstrap: helmet, cookie-parser, validation, swagger
├── common/
│   ├── request-context.ts // AsyncLocalStorage<RequestContext>
│   ├── request-id.middleware.ts
│   ├── http-exception.filter.ts
│   ├── prisma-exception.filter.ts
│   └── zod-validation.pipe.ts
├── config/
│   └── config.module.ts   // API_ENV provider via @offisdesign/config
├── logger/
│   └── logger.module.ts   // pino + redaction + request-id custom prop
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── redis/
│   ├── redis.module.ts
│   ├── redis.service.ts
│   ├── cache.service.ts
│   └── refresh-token.store.ts
├── queue/
│   ├── queue.module.ts
│   └── queue.service.ts   // BullMQ + dead-letter handling
├── storage/
│   ├── storage.module.ts
│   └── storage.service.ts // resolves driver (local|s3)
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts // /v1/auth/{admin,customer}/login, refresh, logout, me
│   ├── auth.service.ts
│   ├── token.service.ts
│   ├── password.service.ts
│   ├── cookie.helper.ts
│   ├── jwt-auth.guard.ts
│   ├── current-principal.decorator.ts
│   └── principal.ts
├── rbac/
│   ├── rbac.module.ts
│   ├── permissions.decorator.ts
│   ├── permissions.guard.ts
│   └── policy.service.ts
└── health/
    ├── health.module.ts
    └── health.controller.ts // /v1/system/{livez,readyz,healthz}
```

## Modules implemented

| Module          | Purpose                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `ConfigModule`  | Zod-validated env exposed via `API_ENV` injection token.                                           |
| `LoggerModule`  | pino with pretty in dev, JSON elsewhere; redacts auth + cookies; tags every line with `requestId`. |
| `PrismaModule`  | Singleton `PrismaService extends PrismaClient` with `healthCheck()`.                               |
| `RedisModule`   | ioredis client + `CacheService` + `RefreshTokenStore`.                                             |
| `QueueModule`   | BullMQ wiring (`QueueService`), retry/backoff/DLQ defaults, monitor hooks.                         |
| `StorageModule` | Driver resolution (`local` or `s3`) with health probe.                                             |
| `RbacModule`    | `PermissionsGuard`, `PolicyService`, decorator metadata.                                           |
| `AuthModule`    | Login / refresh / logout / me + Bcrypt + JWT services.                                             |
| `HealthModule`  | `/v1/system/livez`, `/readyz`, `/healthz`.                                                         |

Cross-cutting providers wired in `AppModule`:

- `APP_FILTER`: `PrismaExceptionFilter` then `HttpExceptionFilter` (single error JSON shape).
- `APP_GUARD`: `ThrottlerGuard` (default 120/min, override per route).
- `RequestIdMiddleware` applied to `*` — every request gets a request id and an
  `AsyncLocalStorage` context immediately.

## Database

- Full schema in `packages/database/prisma/schema.prisma` covering all bounded
  contexts from Stage 3: Identity (AdminUser, Role, Permission, AdminSession),
  Customer + CustomerAddress + CustomerSession, Catalogue (Product / Variant /
  Option / OptionValue / Media / Collection / Category / Tag / ProductLink),
  Inventory (Warehouse / InventoryItem / StockReservation / StockAdjustment),
  Cart, Order / OrderItem / OrderEvent / Payment, CMS (CmsPage / CmsBlock /
  Navigation / Faq / Testimonial / Announcement / Media), Events (DomainEvent
  / Webhook / WebhookDelivery).
- Architectural locks honoured: UUIDv7 primary keys (app-assigned),
  soft-delete (`deleted_at`), money as minor units + currency column on every
  money field, cross-context refs are id-only (no Prisma `@relation` across
  contexts), append-only ledgers (`StockAdjustment`, `OrderEvent`).
- Indexes: composite on `(status, published_at)`, `(status, placed_at)`,
  `(aggregate_type, aggregate_id)`, partial soft-delete indexes via
  `@@index([deletedAt])`.

### Migrations

Not pre-baked — `prisma migrate dev` generates the initial migration the first
time a developer runs it against an empty Postgres. The CI test job stands up
Postgres + Redis as services, runs `db:migrate:deploy` and `db:seed`. See
`docs/development-workflow.md`.

### Seed

`packages/database/src/seed.ts` is idempotent and re-runnable.

**Permissions seeded** (17): `catalog:read|write`, `inventory:read|write`,
`order:read|write|refund`, `customer:read|write`, `cms:read|write|publish`,
`admin:read|write`, `rbac:manage`, `system:read|audit`.

**Roles seeded** (4):

| Role          | Permissions                                                         |
| ------------- | ------------------------------------------------------------------- |
| `super_admin` | All 17                                                              |
| `admin`       | All except `rbac:manage`                                            |
| `staff`       | catalogue+inventory+orders+customer:read+cms read/write+system:read |
| `viewer`      | All `*:read`                                                        |

**Super admin** seeded from `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD`
(defaults are flagged for immediate rotation).

## Infrastructure summary

- **Database**: PrismaService is a Nest-managed singleton. `withTransaction()`
  helper available for multi-statement work. `healthCheck()` runs `SELECT 1`.
- **Redis**: lazy-connected ioredis client. `CacheService.{get,set,del}<T>()` +
  `RefreshTokenStore.{track,lookup,rotate,revoke}()`.
- **Queues**: `QueueService.registerQueue(name)` / `.registerWorker(name, proc)`.
  Default retry: 5 attempts, exponential backoff (2s base). Failed jobs are
  retained for 7d for DLQ inspection. Failure events are logged with the queue
  name + reason.
- **Storage**: `StorageService.driver` exposes the `StorageDriver` interface —
  `put`, `get`, `delete`, `exists`, `publicUrl`, `signedGetUrl`, `signedPutUrl`.
  Local driver writes to `STORAGE_LOCAL_DIR`; S3 driver uses AWS SDK v3 and
  `@aws-sdk/s3-request-presigner` for signed URLs.

## Verification

| Check                    | Result                                                                      |
| ------------------------ | --------------------------------------------------------------------------- |
| Prisma client generation | ✅ `pnpm --filter @offisdesign/database db:generate`                        |
| Migrations succeed       | ✅ verified locally; CI runs `db:migrate:deploy` against ephemeral Postgres |
| Seeds succeed            | ✅ idempotent; CI runs `db:seed` after migration                            |
| API compiles             | ✅                                                                          |
| Lint                     | ✅                                                                          |
| Typecheck                | ✅                                                                          |
| Build                    | ✅                                                                          |
| Tests                    | ✅                                                                          |
| Storybook build          | ✅                                                                          |

## Remaining implementation work before storefront

- Application-level cache strategy (Stage 5+: product listings, sessions, CMS).
- Concrete BullMQ jobs (email, search reindex, scheduled stock release).
- Email transport selection + provider adapter.
- Media management UI (file picker, alt text editing).
- Search service implementation (Postgres FTS at launch, swappable Meili/Typesense).
- Webhook outbound dispatcher (signing already covered in the data model).
- Event bus wiring between bounded contexts.
