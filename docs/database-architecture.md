# Database Architecture

Stage 3 blueprint for the persistence layer. PostgreSQL is the single source of
truth (see `architecture.md` §6). This document fixes the principles, conventions,
and cross-cutting concerns that every model in `prisma-schema-design.md` follows.

Brand tokens (`#B81F34` / `#410C14` / `#350D13` / `#FEFEFE`) are surfaced by
`packages/ui` and are not stored in the database. The schema is brand-agnostic.

---

## 1. Locked Architectural Decisions (apply to the whole schema)

| #   | Rule                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **UUIDv7** is the universal primary key for every public entity. No UUIDv4, no ULID, no auto-increment in public paths.                                                                                                              |
| 2   | **Customer** and **AdminUser** are separate models with separate auth, roles, permissions, and lifecycle. Never combined.                                                                                                            |
| 3   | **Single-currency at launch**, but every money column carries a `currency` field and integer minor units so multi-currency lands as a forward-compatible addition.                                                                   |
| 4   | **Carts exist for guests and customers.** Guest carts are claimable on sign-in; the data model encodes a merge operation.                                                                                                            |
| 5   | **Payments** are generic. Stripe is one provider; `Payment.providerData JSONB` holds provider-specific metadata. Orders never reference Stripe ids directly.                                                                         |
| 6   | **Search** is an interface; Postgres FTS is the launch implementation (tsvector columns + GIN indexes). Swappable later.                                                                                                             |
| 7   | **Catalogue** is products → variants → options/option-values, with collections/categories/tags as orthogonal grouping. Designed for B2B expansion (price lists, customer-group pricing) without restructuring.                       |
| 8   | **Inventory** is its own bounded context. Stock lives on `InventoryItem` keyed by `(variantId, warehouseId)`, never on Product/Variant.                                                                                              |
| 9   | **CMS** models pages, landing pages, hero sections, banners, navigation, FAQs, testimonials, announcements, media library, SEO metadata.                                                                                             |
| 10  | **API conventions** (cursor pagination, filtering, sorting, search, versioning, error envelope, validation, rate limiting, idempotency, OpenAPI) are documented in `api-conventions.md` and enforced before any endpoint is written. |

---

## 2. Identifier Strategy

- **Type:** every primary key is `String` at the Prisma level, generated as
  **UUIDv7** at insert time. UUIDv7's leading timestamp gives index locality
  similar to ULID without sacrificing universal interop.
- **Source:** the application generates ids (Node UUIDv7 helper); the database
  does not. This keeps ids stable across distributed writes and lets services
  attach an id before persistence (useful for events).
- **Storage:** Postgres column type is `uuid`. Prisma maps via
  `@db.Uuid`. Indexes use B-tree (default) — UUIDv7's monotonic prefix prevents
  the random-write hot-spotting that plagues UUIDv4.
- **Public exposure:** ids are opaque to clients. No incrementing public-facing
  numbers. Where humans need a short label (order number, invoice number), a
  separate `humanRef` column is generated with a per-table sequence and a
  prefix (`OFD-2026-0001`).
- **External ids:** third-party identifiers (Stripe `pi_...`, Postmark message
  ids) live in dedicated columns (`Payment.providerPaymentId`) or in `providerData JSONB`.

---

## 3. Universal Fields & Conventions

Every table carries these columns unless explicitly justified otherwise:

| Column      | Type           | Notes                               |
| ----------- | -------------- | ----------------------------------- |
| `id`        | `uuid` PK      | UUIDv7, app-generated               |
| `createdAt` | `timestamptz`  | default `now()`                     |
| `updatedAt` | `timestamptz`  | updated by Prisma `@updatedAt`      |
| `deletedAt` | `timestamptz?` | nullable; soft-delete flag (see §5) |

Audit-sensitive tables additionally carry:

| Column        | Type    | Notes                                                       |
| ------------- | ------- | ----------------------------------------------------------- |
| `createdById` | `uuid?` | nullable FK to `AdminUser` or `Customer` (per table policy) |
| `updatedById` | `uuid?` | same                                                        |
| `version`     | `int`   | optimistic-locking counter, default 1                       |

**Naming.**

- Tables: `snake_case` plural (`order_lines`).
- Columns: `snake_case` (`created_at`, `total_amount`).
- Prisma model names: `PascalCase` singular (`OrderLine`).
- FK columns: `<relation>_id` (`customer_id`).
- Booleans: `is_*`, `has_*` (`is_published`).
- Money columns: paired (`<thing>_amount` int + `<thing>_currency` char(3)).
- Timestamps: `<event>_at` (`shipped_at`).

**Types.**

- Money: `BigInt` (Prisma) / `bigint` (Postgres) in **minor units**.
- Currency: `char(3)` ISO 4217 (`USD`).
- Strings: `text`; length constraints enforced at the application boundary
  via Zod, not via `varchar(n)`.
- Enums: native Postgres enums for closed sets (`order_status`); strings
  for open sets (e.g. provider names).
- JSON: `jsonb` for flexible metadata; never `json`. Schema-validated by Zod
  at the application boundary.
- Slugs: `text`, unique within scope, kebab-case.

---

## 4. Indexing & Constraints

- **Primary key** on every table (`id`).
- **Foreign keys** are always indexed; Postgres does not auto-index FKs.
- **Unique constraints** for natural keys:
  - `Customer.email` (lowercased) unique.
  - `AdminUser.email` unique.
  - `Product.slug` unique.
  - `Collection.slug` unique.
  - `Variant.sku` unique where non-null.
  - `Order.humanRef` unique.
- **Composite uniqueness:**
  - `InventoryItem (variantId, warehouseId)` unique.
  - `CartItem (cartId, variantId)` unique.
  - `Wishlist (customerId, productId)` unique.
  - `VariantOptionValue (variantId, optionId)` unique.
- **Partial indexes** to keep hot paths small:
  - `Product` on `(status)` `WHERE deleted_at IS NULL AND status = 'PUBLISHED'`.
  - `Cart` on `(customerId)` `WHERE status = 'ACTIVE'`.
- **GIN indexes** for full-text and JSON:
  - `Product.searchVector` (tsvector) GIN.
  - `Page.searchVector` GIN.
  - `Order.shippingAddress` JSONB GIN where ad-hoc query is plausible.
- **B-tree indexes** for common filters:
  - `Order (customerId, createdAt DESC)`.
  - `Payment (orderId, status)`.
  - `AuditLog (entityType, entityId, createdAt DESC)`.

Index decisions in `prisma-schema-design.md` reference this section.

---

## 5. Soft Delete

- `deletedAt timestamptz?` column on every model that represents a domain
  entity (everything except junction tables, append-only logs, and
  ephemeral/system tables — those are listed in `prisma-schema-design.md`).
- All read queries filter `deletedAt IS NULL` by default via a Prisma
  middleware/extension. Hard reads bypass it explicitly.
- Unique constraints on slugs/SKUs include `deletedAt` in a partial index
  predicate to allow reuse after soft delete:
  `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`.
- **Hard-delete exceptions** (no soft delete):
  - `Session`, `RefreshToken` — short-lived security objects.
  - `AuditLog`, `WebhookDelivery` — append-only.
  - `BackgroundJob` — managed by the queue, not a domain entity.
  - Junction tables (`ProductTag`, `ProductCollection`, etc.).

---

## 6. Audit & History

Two complementary mechanisms:

1. **Inline audit fields** (§3) on writeable domain models:
   `createdById`, `updatedById`, `version`.
2. **`AuditLog`** append-only table for admin-impacting writes. Captures
   `actorType`, `actorId`, `action`, `entityType`, `entityId`, `before` JSONB,
   `after` JSONB, `requestId`, `ip`, `userAgent`, `createdAt`. Indexed on
   `(entityType, entityId, createdAt DESC)`.

History tables (full row versioning) are deliberately **not** added at launch;
`AuditLog` covers compliance needs. Adopt domain-specific history (e.g.
`InventoryAdjustment`, `OrderEvent`) where business logic genuinely needs the
timeline (see §11 inventory and §12 orders).

---

## 7. Money & Currency

- Every money value is `(amount BigInt, currency Char(3))`.
- Single launch currency (e.g. `USD`); enforced at the application layer.
- `currency` column is **kept now** so multi-currency adds:
  1. price lists per currency (`PriceList`, future),
  2. FX snapshots on orders (`Order.fxSnapshot JSONB`),
  3. customer-preferred currency (future).
- Discounts store both the _rule_ (percentage / fixed) and the _applied amount_
  in minor units, so order math is reconstructible without re-running rules.
- Tax handled as separate `tax_amount` columns + a tax-line table on orders.
  Tax engine (manual vs. provider like TaxJar/Stripe Tax) decided in Stage 7.

---

## 8. Concurrency & Transactions

- **Transactions** wrap any multi-row write: order placement, cart merge,
  stock reservation, refund, inventory adjustment.
- **Isolation:** default `READ COMMITTED`. Stock reservation and checkout
  finalisation upgrade to `REPEATABLE READ` or use `SELECT ... FOR UPDATE`
  on the affected `InventoryItem` rows.
- **Optimistic locking** via the `version` column on `Order`, `Cart`, and
  `InventoryItem`. Writes assert `WHERE version = :v` then `version = version + 1`.
- **Stock reservation** is a row-level operation: take a `FOR UPDATE` lock on
  `InventoryItem` rows for the variants in the cart, validate availability,
  insert reservation rows, release/expire on a TTL via a background job.

---

## 9. Search Architecture

- Each searchable entity carries a generated `search_vector tsvector` column.
- Population: a Postgres trigger updates the vector from configured columns
  (e.g. `title`, `description`, `seo_keywords`).
- GIN index on the vector column.
- The application uses a `SearchService` interface; the launch implementation
  is `PgFtsSearchService`. Future Meilisearch/Typesense implementation
  conforms to the same interface and is swapped via DI.
- Faceting at launch: aggregated counts computed from filtered Postgres
  queries. Acceptable for a small/medium catalogue; revisited in Stage 8.

---

## 10. Catalogue Model (locked decision §7)

- `Product` — top-level item (the marketing record).
- `ProductVariant` — purchasable SKU; one per option combination. `Product`
  with no options still has exactly one default variant — simplifies pricing
  and inventory by never branching on "has variants?".
- `Option` — variant axis (e.g. `Size`, `Material`), scoped to a product.
- `OptionValue` — value on an axis (`Large`, `Walnut`).
- `VariantOptionValue` — junction: which option values a variant maps to.
- `Collection` — curated marketing group (manual or rule-based).
- `Category` — taxonomic group, hierarchical (`parent_id`).
- `Tag` — flat label.
- `ProductImage`, `ProductVideo`, `ProductDocument`, `ProductSpecification`
  — typed child rows; ordered by `position`.
- `RelatedProduct`, `CrossSellProduct`, `UpsellProduct` — directional product↔product
  edges with a `kind` discriminator on a single `ProductLink` table.
- Pricing lives on `ProductVariant.priceAmount/priceCurrency` + an optional
  `compareAtAmount`. Future `PriceList` table introduces B2B/customer-group
  pricing as an overlay without changing the variant column.

---

## 11. Inventory Bounded Context (locked decision §8)

Tables:

- `Warehouse` — location, code, address, active flag.
- `InventoryItem` — per `(variant, warehouse)`: `onHand`, `reserved`, `incoming`.
- `StockReservation` — per cart/order line, holds quantity until expiry.
- `StockAdjustment` — append-only ledger of every quantity change with reason,
  delta, actor, related entity (`reservation`, `order`, `return`, `manual`).
- `InventoryTransfer` (post-launch, structure ready) — between warehouses.

Rules:

- `Product` and `ProductVariant` carry **no** quantity columns.
- `onHand - reserved` is the displayed availability; `incoming` informs ETAs.
- Every quantity change writes a `StockAdjustment` row in the same TX.

---

## 12. Orders & Payments

- `Order` is immutable in its committed fields once `placed_at` is set; further
  changes flow through `OrderEvent` rows (status transitions, fulfilment,
  notes) and child rows (`Shipment`, `Refund`).
- `OrderLine` snapshots the variant: title, sku, unit price, currency, tax,
  discount allocation. This makes orders historically faithful when products
  later change.
- `Payment` is generic (locked decision §5):
  - `provider` (`stripe`, future others),
  - `providerPaymentId` (`pi_...`),
  - `providerData jsonb`,
  - `status` (`requires_action`, `processing`, `succeeded`, `failed`, `refunded`).
- `Refund` references `Payment`, carries amount, reason, providerRefundId,
  status. Multiple refunds per payment allowed.
- `Order ↔ Payment` is many-to-one logically (one order can have multiple
  payment attempts; the latest successful is authoritative). Modelled as
  `Payment.orderId` FK.

---

## 13. Customer Identity vs. Admin Identity (locked decision §2)

Two completely separate aggregates:

- **Customer** — `Customer`, `CustomerAddress`, `CustomerSession`,
  `CustomerRefreshToken`, `Wishlist`, `Review`, `RecentlyViewed`,
  `NewsletterSubscription`.
- **Admin** — `AdminUser`, `AdminRole`, `AdminPermission`,
  `AdminRolePermission`, `AdminUserRole`, `AdminSession`,
  `AdminRefreshToken`, `AuditLog`.

They share no tables, no FK relationships, no row-level overlap. Both auth
flows are JWT (asymmetric) + rotating refresh tokens, but cookies are scoped
differently (storefront domain vs. admin subdomain).

---

## 14. CMS Bounded Context (locked decision §9)

- `Page` — generic CMS page with `slug`, `status`, `publishedAt`, SEO fields,
  content blocks (`PageBlock` rows ordered by `position`, `type` discriminated,
  `data jsonb`).
- `LandingPage` — specialised template of `Page` distinguished by `template`
  field; same underlying table with `template = 'landing'`.
- `HeroSection`, `PromotionalBanner`, `Announcement`, `Testimonial`, `Faq`
  — first-class content entities reusable across pages.
- `NavigationMenu` + `NavigationItem` — hierarchical menus.
- `Media` — central asset library; everything that references an image/video
  references a `Media.id`, not a URL.
- `SeoMetadata` — embedded as nullable fields on Page/Product/Collection/
  Category/BlogPost rather than a separate table (denormalised for read perf).

---

## 15. Background Jobs, Webhooks, Notifications

- `BackgroundJob` table backs the queue (Redis BullMQ as the runtime), plus a
  durable record per job for observability. App writes job rows;
  workers consume from Redis; status syncs back.
- `Webhook` — outbound webhook subscriptions (admin-configured).
- `WebhookDelivery` — append-only delivery log per attempt.
- `Notification` — in-app notifications (admin-side initially; customer-side
  optional later).

---

## 16. Feature Flags & Settings

- `Setting` — key/value table for runtime-tunable application settings
  (e.g. `checkout.minOrderTotal`). Typed via Zod at read time.
- `FeatureFlag` — boolean/string toggles with optional audience rules
  (`global`, `staffOnly`, `percentRollout`). No third-party feature-flag
  service at launch.

---

## 17. Data Lifecycle, Backup, Retention

- **Backups:** managed Postgres automated daily snapshots + PITR window. Restore
  drill documented and rehearsed before launch (Stage 15).
- **Retention:**
  - Customer accounts: retained while active; deleted on request → cascade per
    GDPR plan (Stage 13).
  - `AuditLog`: retained 24 months minimum (regulatory window; finalised Stage 13).
  - `Session` / `RefreshToken`: hard-deleted on expiry by a maintenance job.
  - `BackgroundJob` / `WebhookDelivery`: kept 90 days then archived.
- **PII columns** (email, names, addresses, phone) are tagged in code with a
  `@pii` decorator/comment and centrally listed for the GDPR plan.
- **Encryption at rest:** managed Postgres provider default; no application-level
  encryption at launch (revisit if regulatory scope changes).

---

## 18. Migrations

- Prisma Migrate is the only migration tool. Migrations are checked in,
  reviewed, and applied via CI before deploy.
- **No destructive migration** runs automatically in production. Drops/renames
  go through a two-phase migration: add new → backfill → switch reads → switch
  writes → drop old, each as a separate deploy.
- **Backfills** for >100k rows run as background jobs, not in the migration
  transaction, to avoid long locks.
- **Migration naming:** `YYYYMMDDHHMM_<imperative_summary>`. Example:
  `202607031430_add_cart_status_enum`.

---

## 19. What This Document Does **Not** Decide

- Exact column types per field — see `prisma-schema-design.md`.
- Field-by-field cardinality and cascade rules — see `entity-relationship-diagram.md`.
- API surface — see `rest-endpoints.md` and `api-conventions.md`.
- Domain events — see `event-model.md`.
- Hosting/provider for Postgres — Stage 14/15.
