# Prisma Schema Design

Stage 3 model-by-model plan for `packages/database/prisma/schema.prisma`.
**Nothing in this file is implemented yet** — this is the design Stage 4
will translate into actual `.prisma` syntax.

Conventions from `database-architecture.md`:

- All ids are `String @id @default(uuidv7()) @db.Uuid` (Prisma 5.15+ exposes
  `uuidv7()`; if unavailable in the chosen minor we generate in app code and
  pass `@db.Uuid`).
- All entities carry `createdAt`, `updatedAt`. Soft-deletable entities carry
  `deletedAt`. Money carries `<thing>Amount BigInt + <thing>Currency String @db.Char(3)`.
- Table mapping is `snake_case` plural via `@@map`.
- Junction tables use composite PKs unless an explicit `id` is needed.

Tables marked **APPEND-ONLY** have no soft delete and no updates after insert.
Tables marked **NO SOFT DELETE** are hard-deleted on expiry/lifecycle end.

---

## 1. Enums (Postgres-native)

| Enum                     | Values                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `CustomerStatus`         | `Pending`, `Active`, `Suspended`, `Deleted`                                                                                |
| `AdminUserStatus`        | `Active`, `Suspended`                                                                                                      |
| `ProductStatus`          | `Draft`, `Published`, `Archived`                                                                                           |
| `CollectionType`         | `Manual`, `Rule`                                                                                                           |
| `ProductLinkKind`        | `Related`, `CrossSell`, `UpSell`                                                                                           |
| `CartStatus`             | `Active`, `Merged`, `Abandoned`, `Converted`, `Expired`                                                                    |
| `OrderStatus`            | `Pending`, `AwaitingPayment`, `Paid`, `Fulfilling`, `Shipped`, `Completed`, `Cancelled`, `Refunded`                        |
| `OrderEventType`         | `Placed`, `PaymentInitiated`, `PaymentSucceeded`, `PaymentFailed`, `Shipped`, `Delivered`, `Cancelled`, `Refunded`, `Note` |
| `PaymentProvider`        | `Stripe` (extensible)                                                                                                      |
| `PaymentStatus`          | `RequiresAction`, `Processing`, `Succeeded`, `Failed`, `Cancelled`, `Refunded`, `PartiallyRefunded`                        |
| `RefundStatus`           | `Pending`, `Succeeded`, `Failed`                                                                                           |
| `CouponType`             | `Percentage`, `Fixed`                                                                                                      |
| `CouponScope`            | `Order`, `Products`, `Collections`                                                                                         |
| `CouponStatus`           | `Active`, `Scheduled`, `Expired`, `Disabled`                                                                               |
| `StockAdjustmentReason`  | `Reservation`, `Release`, `Order`, `Return`, `Manual`, `TransferIn`, `TransferOut`, `Recount`                              |
| `StockReservationStatus` | `Active`, `Committed`, `Released`, `Expired`                                                                               |
| `ActorType`              | `Customer`, `AdminUser`, `System`                                                                                          |
| `PageStatus`             | `Draft`, `Scheduled`, `Published`, `Archived`                                                                              |
| `PageTemplate`           | `Default`, `Landing`, `Custom`                                                                                             |
| `PageBlockType`          | `Hero`, `Banner`, `Testimonial`, `Faq`, `RichText`, `ProductGrid`, `Image`, `Video`, `Cta`, `Reference`                    |
| `MediaKind`              | `Image`, `Video`, `Document`                                                                                               |
| `BlogPostStatus`         | `Draft`, `Scheduled`, `Published`, `Archived`                                                                              |
| `ReviewStatus`           | `Pending`, `Published`, `Rejected`                                                                                         |
| `NewsletterStatus`       | `Pending`, `Confirmed`, `Unsubscribed`                                                                                     |
| `NotificationKind`       | `OrderUpdate`, `StockLow`, `WebhookFailed`, `System`                                                                       |
| `FeatureFlagAudience`    | `Global`, `StaffOnly`, `PercentRollout`                                                                                    |
| `WebhookDeliveryStatus`  | `Pending`, `Succeeded`, `Failed`, `Abandoned`                                                                              |
| `BackgroundJobStatus`    | `Queued`, `Active`, `Completed`, `Failed`, `Delayed`, `Cancelled`                                                          |
| `AnnouncementSeverity`   | `Info`, `Warning`, `Critical`                                                                                              |
| `BannerPlacement`        | `Top`, `Bottom`, `HomeHero`, `Pdp`, `Plp`                                                                                  |

Enums grow only via migration; never as free-text columns.

---

## 2. Identity — Customer side

### 2.1 `Customer` (`customers`)

| Field                                 | Type             | Notes                        |
| ------------------------------------- | ---------------- | ---------------------------- |
| `id`                                  | uuid PK          | UUIDv7                       |
| `email`                               | text             | lowercased before write      |
| `passwordHash`                        | text?            | nullable for guest customers |
| `firstName`                           | text?            |                              |
| `lastName`                            | text?            |                              |
| `phone`                               | text?            |                              |
| `isGuest`                             | boolean          | default false                |
| `emailVerifiedAt`                     | timestamptz?     |                              |
| `status`                              | `CustomerStatus` | default `Pending`            |
| `lastLoginAt`                         | timestamptz?     |                              |
| `createdAt`, `updatedAt`, `deletedAt` | std              |                              |

Indexes:

- `@@unique([email])` — partial, `WHERE deleted_at IS NULL`.
- `@@index([status])`.
- `@@index([createdAt])`.

### 2.2 `CustomerAddress` (`customer_addresses`)

Fields: `customerId` FK CASCADE, `label?`, `recipientName`, `line1`, `line2?`,
`city`, `region?`, `postalCode`, `country` (ISO-3166 alpha-2), `phone?`,
`isDefaultShipping bool`, `isDefaultBilling bool`. Std timestamps + soft delete.

Indexes:

- `@@index([customerId])`.
- Partial unique: `(customerId) WHERE isDefaultShipping`.
- Partial unique: `(customerId) WHERE isDefaultBilling`.

### 2.3 `CustomerSession` (`customer_sessions`) — **NO SOFT DELETE**

Fields: `customerId` FK CASCADE, `userAgent?`, `ip?`, `lastSeenAt`, `expiresAt`.
Indexes: `@@index([customerId])`, `@@index([expiresAt])`.

### 2.4 `CustomerRefreshToken` (`customer_refresh_tokens`) — **NO SOFT DELETE**

Fields: `customerId` FK CASCADE, `chainId` uuid, `tokenHash` text unique,
`revokedAt?`, `expiresAt`.
Indexes: `@@index([customerId])`, `@@index([chainId])`, `@@index([expiresAt])`.

---

## 3. Identity — Admin side

### 3.1 `AdminUser` (`admin_users`)

Fields: `email` unique partial (`WHERE deleted_at IS NULL`), `passwordHash`,
`firstName?`, `lastName?`, `mfaEnabled bool default false`, `mfaSecret text?`
(encrypted at app layer when set), `status AdminUserStatus default Active`,
`lastLoginAt?`. Std + soft delete.

### 3.2 `AdminRole` (`admin_roles`)

Fields: `key text unique`, `name text`. Std + soft delete.

### 3.3 `AdminPermission` (`admin_permissions`)

Fields: `key text unique` (e.g. `catalog:write`), `description text?`. Std (no soft delete; reference data).

### 3.4 `AdminUserRole` (`admin_user_roles`) — junction

Composite PK `(adminUserId, roleId)`. Both FKs CASCADE.

### 3.5 `AdminRolePermission` (`admin_role_permissions`) — junction

Composite PK `(roleId, permissionId)`. Both FKs CASCADE.

### 3.6 `AdminSession` / `AdminRefreshToken` — **NO SOFT DELETE**

Same shape as customer variants but FK to `AdminUser`.

---

## 4. Catalog

### 4.1 `Product` (`products`)

| Field                                                                                             | Type            | Notes                                 |
| ------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------- |
| `slug`                                                                                            | text            | unique partial (active)               |
| `title`                                                                                           | text            |                                       |
| `subtitle`                                                                                        | text?           |                                       |
| `description`                                                                                     | text?           | rich text source                      |
| `status`                                                                                          | `ProductStatus` | default Draft                         |
| `publishedAt`                                                                                     | timestamptz?    |                                       |
| `searchVector`                                                                                    | tsvector        | `@db.TsVector`, generated via trigger |
| `seoMetaTitle`, `seoMetaDescription`, `seoOgMediaId uuid?`, `seoCanonicalUrl?`, `seoNoIndex bool` |                 |                                       |
| std + soft delete                                                                                 |                 |                                       |
| `createdById`, `updatedById`, `version`                                                           | audit fields    |                                       |

Indexes:

- Partial unique on `slug` WHERE `deleted_at IS NULL`.
- `@@index([status])`.
- GIN on `searchVector`.

### 4.2 `ProductVariant` (`product_variants`)

Fields: `productId` FK CASCADE, `sku text?`, `title text?`, `priceAmount BigInt`,
`priceCurrency Char(3)`, `compareAtAmount BigInt?`, `position int`,
`isDefault bool default false`, `weightGrams int?`, `barcode text?`.
Std + soft delete.

Indexes:

- Partial unique on `sku` WHERE `sku IS NOT NULL AND deleted_at IS NULL`.
- `@@index([productId, position])`.
- Partial unique `(productId) WHERE isDefault` — only one default variant per product.

### 4.3 `Option` (`options`)

Fields: `productId` FK CASCADE, `name text`, `position int`.
Unique `(productId, name)`.

### 4.4 `OptionValue` (`option_values`)

Fields: `optionId` FK CASCADE, `value text`, `position int`.
Unique `(optionId, value)`.

### 4.5 `VariantOptionValue` (`variant_option_values`) — junction

Composite PK `(variantId, optionId)`. Fields: `optionValueId` FK CASCADE.
Unique `(variantId, optionId)`.

### 4.6 `ProductImage`, `ProductVideo`, `ProductDocument`

Fields: `productId` FK CASCADE, `mediaId uuid`, `altText?`, `position int`,
`label?` (document only). Std.

### 4.7 `ProductSpecification` (`product_specifications`)

Fields: `productId` FK CASCADE, `label text`, `value text`, `position int`.

### 4.8 `Collection` (`collections`)

Fields: `slug text` (partial unique), `title`, `description?`, `type CollectionType`,
`rules jsonb?` (when `Rule`), `seo*` fields, `searchVector`.
Std + soft delete.

### 4.9 `Category` (`categories`)

Fields: `slug` (unique), `parentId uuid?` (self-FK RESTRICT), `title`,
`description?`, `position int`, `seo*` fields.

### 4.10 `Tag` (`tags`)

Fields: `slug` (unique), `name`. Std.

### 4.11 Junctions

- `ProductCollection (productId, collectionId)` CASCADE both. `position int`.
- `ProductCategory (productId, categoryId)` CASCADE both. `isPrimary bool`.
- `ProductTag (productId, tagId)` CASCADE both.

### 4.12 `ProductLink` (`product_links`)

Fields: `sourceProductId uuid` FK CASCADE, `targetProductId uuid` (no FK,
allowed cross-store later), `kind ProductLinkKind`, `position int`.
Unique `(sourceProductId, targetProductId, kind)`.

---

## 5. Inventory

### 5.1 `Warehouse` (`warehouses`)

Fields: `code text unique`, `name`, `address jsonb`, `isActive bool`,
`isDefault bool`. Std + soft delete. Partial unique `isDefault`.

### 5.2 `InventoryItem` (`inventory_items`)

Fields: `warehouseId` FK RESTRICT, `variantId uuid` (id-only ref), `onHand int >= 0`,
`reserved int >= 0`, `incoming int >= 0`, `version int default 1`.

- Unique `(warehouseId, variantId)`.
- `@@index([variantId])` for cross-warehouse aggregation.
- CHECK `reserved <= on_hand`.

### 5.3 `StockReservation` (`stock_reservations`)

Fields: `inventoryItemId` FK CASCADE, `qty int > 0`, `status StockReservationStatus`,
`reason text`, `cartId uuid?`, `orderLineId uuid?`, `expiresAt`, `committedAt?`,
`releasedAt?`.
Indexes: `@@index([status, expiresAt])`, `@@index([cartId])`,
`@@index([orderLineId])`. NO soft delete (status is lifecycle).

### 5.4 `StockAdjustment` (`stock_adjustments`) — **APPEND-ONLY**

Fields: `inventoryItemId` FK RESTRICT, `delta int`, `onHandAfter int`,
`reservedAfter int`, `reason StockAdjustmentReason`, `actorType ActorType`,
`actorId uuid?`, `relatedEntityType text?`, `relatedEntityId uuid?`,
`note text?`.
Index: `@@index([inventoryItemId, createdAt])`.

---

## 6. Pricing & Promotions

### 6.1 `Coupon` (`coupons`)

Fields: `code text unique partial`, `type CouponType`, `value int` (percent 0–100
or minor units), `scope CouponScope`, `minOrderAmount bigint?`,
`maxUses int?`, `maxUsesPerCustomer int?`, `startsAt?`, `endsAt?`,
`status CouponStatus`. Std + soft delete.

### 6.2 `CouponProduct`, `CouponCollection` — junctions

Composite PKs. CASCADE both.

### 6.3 `CouponRedemption` (`coupon_redemptions`) — **APPEND-ONLY**

Fields: `couponId` FK CASCADE, `orderId uuid` (id-only), `customerId uuid?`,
`redeemedAt`, `amountApplied bigint`.
Indexes: `@@index([couponId, redeemedAt])`, `@@index([customerId])`.

### 6.4 `Discount` (`discounts`)

Same shape as `Coupon` minus `code` and `maxUsesPerCustomer`; adds
`priority int` and `rules jsonb`. Std + soft delete.

---

## 7. Cart

### 7.1 `Cart` (`carts`)

Fields: `customerId uuid?`, `guestToken text?`, `status CartStatus default Active`,
`currency Char(3)`, `mergedIntoCartId uuid?`, `convertedOrderId uuid?`,
`expiresAt?`, `version int default 1`. Std + soft delete.

- CHECK `(customer_id IS NOT NULL OR guest_token IS NOT NULL)`.
- Partial unique `(customerId) WHERE status='Active' AND customer_id IS NOT NULL`.
- Partial unique `(guestToken) WHERE status='Active' AND guest_token IS NOT NULL`.
- `@@index([status])`.

### 7.2 `CartItem` (`cart_items`)

Fields: `cartId` FK CASCADE, `variantId uuid`, `productId uuid`,
`qty int > 0`, `unitPriceAmount bigint`, `unitPriceCurrency Char(3)`,
`addedAt`.

- Unique `(cartId, variantId)`.

---

## 8. Checkout & Orders

### 8.1 `Order` (`orders`)

Fields: `humanRef text unique`, `customerId uuid`, `status OrderStatus`,
`currency Char(3)`, `subtotalAmount bigint`, `discountAmount bigint`,
`shippingAmount bigint`, `taxAmount bigint`, `totalAmount bigint`,
`shippingAddress jsonb`, `billingAddress jsonb`, `customerEmail text`,
`couponCode text?`, `placedAt`, `cancelledAt?`, `completedAt?`,
`version int default 1`. Std + soft delete + audit fields.

Indexes: `@@index([customerId, createdAt])`, `@@index([status])`,
`@@index([placedAt])`.

### 8.2 `OrderLine` (`order_lines`)

Fields: `orderId` FK CASCADE, `variantId uuid`, `productId uuid`,
`variantTitle text`, `productTitle text`, `sku text?`, `qty int`,
`unitPriceAmount bigint`, `unitPriceCurrency Char(3)`,
`discountAllocationAmount bigint default 0`, `taxAmount bigint default 0`,
`lineTotalAmount bigint`.
Index: `@@index([orderId])`.

### 8.3 `OrderEvent` (`order_events`) — **APPEND-ONLY**

Fields: `orderId` FK CASCADE, `type OrderEventType`, `data jsonb?`,
`actorType ActorType`, `actorId uuid?`, `note text?`.
Index: `@@index([orderId, createdAt])`.

### 8.4 `Shipment` (`shipments`)

Fields: `orderId` FK CASCADE, `carrier text?`, `trackingNumber text?`,
`shippedAt?`, `deliveredAt?`, `notes text?`. Std.

### 8.5 `ShipmentLine` (`shipment_lines`)

Fields: `shipmentId` FK CASCADE, `orderLineId uuid` FK RESTRICT, `qty int`.
Unique `(shipmentId, orderLineId)`.

### 8.6 `Payment` (`payments`)

Fields: `orderId` FK RESTRICT, `provider PaymentProvider`,
`providerPaymentId text?`, `providerCustomerId text?`,
`providerData jsonb default '{}'`, `amount bigint`, `currency Char(3)`,
`status PaymentStatus`, `capturedAt?`, `failureCode text?`, `failureReason text?`,
`idempotencyKey text?`. Std + audit.

- Unique partial `providerPaymentId`.
- Unique `idempotencyKey` (per-request idempotency).
- `@@index([orderId, status])`.

### 8.7 `Refund` (`refunds`)

Fields: `paymentId` FK CASCADE, `amount bigint`, `currency Char(3)`,
`reason text?`, `providerRefundId text?`, `status RefundStatus`. Std + audit.

---

## 9. Content (CMS)

### 9.1 `Page` (`pages`)

Fields: `slug text`, `locale Char(2) default 'en'`, `template PageTemplate`,
`status PageStatus`, `title text`, `summary text?`, `publishedAt?`,
`searchVector tsvector`, `seoMetaTitle?`, `seoMetaDescription?`,
`seoOgMediaId uuid?`, `seoCanonicalUrl?`, `seoNoIndex bool default false`.
Std + soft delete + audit.

- Unique `(slug, locale, template)` partial (active).
- GIN on `searchVector`.

### 9.2 `PageBlock` (`page_blocks`)

Fields: `pageId` FK CASCADE, `position int`, `type PageBlockType`,
`data jsonb`, `refEntityType text?`, `refEntityId uuid?`. Std.
Index: `@@index([pageId, position])`.

### 9.3 `HeroSection`, `PromotionalBanner`, `Announcement`, `Testimonial`, `Faq`

Standalone entities; field lists per `entity-relationship-diagram.md` §8.
All std + soft delete + audit.

### 9.4 `NavigationMenu` / `NavigationItem`

`NavigationMenu` has `key unique`. `NavigationItem` has `menuId` FK CASCADE,
`parentId uuid? self-FK RESTRICT`, `label`, `href?`, `position`,
`refEntityType?`, `refEntityId?`. Indexes: `@@index([menuId, parentId, position])`.

### 9.5 `Author` / `BlogPost`

`BlogPost` carries `authorId` FK RESTRICT, `slug` unique partial, `status`,
`title`, `excerpt?`, `body`, `coverMediaId uuid?`, `publishedAt?`,
`searchVector`, `seo*`. Std + soft delete + audit.

### 9.6 `Media` (`media`)

Fields: `kind MediaKind`, `s3Key text unique`, `mimeType text`, `byteSize int`,
`width int?`, `height int?`, `durationMs int?`, `variants jsonb default '{}'`,
`altText text?`, `originalFilename text?`. Std + soft delete + audit.

---

## 10. Customer Engagement

### 10.1 `Wishlist` (`wishlists`)

Fields: `customerId` FK CASCADE, `productId uuid`, `note text?`. Std.

- Unique `(customerId, productId)`.

### 10.2 `Review` (`reviews`)

Fields: `customerId` FK RESTRICT, `productId uuid`, `rating int (1..5)`,
`title text?`, `body text`, `status ReviewStatus default Pending`,
`publishedAt?`, `moderatedByAdminId uuid?`. Std + soft delete.

- Unique partial `(customerId, productId) WHERE deleted_at IS NULL`.

### 10.3 `RecentlyViewed` (`recently_viewed`)

Fields: `customerId` FK CASCADE, `productId uuid`, `viewedAt`. NO soft delete.

- Unique `(customerId, productId)` — `viewedAt` updates on re-view.

### 10.4 `NewsletterSubscription` (`newsletter_subscriptions`)

Fields: `email text unique partial`, `customerId uuid? FK SET NULL`,
`status NewsletterStatus`, `confirmationTokenHash?`, `confirmedAt?`,
`unsubscribedAt?`. Std + soft delete.

---

## 11. Platform

### 11.1 `AuditLog` (`audit_logs`) — **APPEND-ONLY**

Fields: `actorType ActorType`, `actorId uuid?`, `action text`,
`entityType text`, `entityId uuid`, `before jsonb?`, `after jsonb?`,
`requestId text?`, `ip text?`, `userAgent text?`. `createdAt` only (no updated/deleted).
Indexes: `@@index([entityType, entityId, createdAt])`, `@@index([actorType, actorId])`.

### 11.2 `Setting` (`settings`)

Fields: `key text unique`, `value jsonb`, `updatedByAdminId uuid?`. Std.

### 11.3 `FeatureFlag` (`feature_flags`)

Fields: `key text unique`, `value jsonb`, `audience FeatureFlagAudience`,
`audienceConfig jsonb default '{}'`, `description text?`. Std + audit.

### 11.4 `Notification` (`notifications`)

Fields: `recipientType ActorType`, `recipientId uuid`, `kind NotificationKind`,
`payload jsonb`, `readAt?`. Std.
Index: `@@index([recipientType, recipientId, readAt])`.

### 11.5 `Webhook` (`webhooks`)

Fields: `url text`, `secretHash text`, `events text[]`, `isActive bool default true`,
`createdByAdminId` FK RESTRICT. Std + soft delete.

### 11.6 `WebhookDelivery` (`webhook_deliveries`) — **APPEND-ONLY**

Fields: `webhookId` FK CASCADE, `event text`, `payload jsonb`,
`responseStatus int?`, `responseBody text?`, `attempt int`,
`status WebhookDeliveryStatus`, `deliveredAt?`, `nextAttemptAt?`.
Indexes: `@@index([webhookId, createdAt])`, `@@index([status, nextAttemptAt])`.

### 11.7 `BackgroundJob` (`background_jobs`)

Fields: `queue text`, `name text`, `payload jsonb`, `status BackgroundJobStatus`,
`attempts int default 0`, `failedReason text?`, `scheduledFor?`,
`startedAt?`, `completedAt?`. NO soft delete (lifecycle by status).
Indexes: `@@index([queue, status])`, `@@index([scheduledFor])`.

---

## 12. Triggers, Generated Columns, Extensions

- `pgcrypto` and `uuid-ossp` extensions enabled (or rely on app-generated UUIDv7).
- `pg_trgm` enabled for fuzzy match on admin searches.
- `search_vector` columns populated by triggers:
  - `products.search_vector` ← `title || subtitle || description || tags || sku`.
  - `pages.search_vector` ← `title || summary || block text`.
  - `blog_posts.search_vector`← `title || excerpt || body`.
  - `collections.search_vector` ← `title || description`.
- Trigger functions live in dedicated migrations.

---

## 13. Soft-Delete Filtering

A Prisma client extension (in `packages/database`) wraps `findMany`,
`findFirst`, `findUnique` for soft-deletable models with a default
`where: { deletedAt: null }`. Repositories that need hard reads use a
namespaced helper (`prisma.product.findManyIncludingDeleted(...)`).

The extension also forwards `delete(...)` to `update({ data: { deletedAt: now } })`
for soft-deletable models; physical deletes use `hardDelete(...)`.

---

## 14. Validation & Constraints Summary

- **NOT NULL** is the default; nullable columns are marked `?` only when the
  domain genuinely allows it.
- **CHECK constraints** enforce non-negative quantities, percentage ranges
  (`value BETWEEN 0 AND 100` for percentage coupons), and the cart owner
  exclusivity.
- **Foreign keys** are declared in Prisma where same-context; cross-context
  references are uuid columns without `@relation` (per `domain-model.md` §12).
- **JSONB columns** are validated at the application boundary by Zod schemas
  in `packages/types`. The DB does not validate JSON shape.

---

## 15. Initial Seed Data (planned for Stage 4)

The migration set ships a seed that creates:

- One default `Warehouse` (`code='MAIN'`, `isDefault=true`).
- Core `AdminPermission` rows (full catalogue listed in `rest-endpoints.md`).
- Default `AdminRole` set: `superadmin`, `admin`, `staff`, `viewer`.
- A `superadmin` `AdminUser` from env (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`).
- Default `Setting` values per the registered Setting catalogue.
- A `Page` row for the homepage with an empty block list.

Seeding is idempotent; running it twice does not duplicate rows.
