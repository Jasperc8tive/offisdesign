# Domain Model

Stage 3 domain model. This document defines the **bounded contexts**, the
**aggregates** within each, the **entities** and **value objects**, the
**invariants** they protect, and the **relationships** that cross context
boundaries. Storage shape is in `prisma-schema-design.md`; this is the
business-level model the code is organised around.

Locked decisions from Stage 3 (see `database-architecture.md` §1) apply
universally and are not restated per context.

---

## 1. Bounded Contexts

Nine bounded contexts. Each maps 1:1 to a module under `apps/api/src/modules/`
(see `monorepo-structure.md` §2.3) and owns its own tables.

| Context                  | Purpose                                                                                 | Owns                                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Identity**             | Customers, admin users, sessions, RBAC                                                  | Customer*, AdminUser*, Sessions, RefreshTokens, Roles, Permissions                                                            |
| **Catalog**              | Products, variants, options, collections, categories, media-references                  | Product*, Variant*, Option\*, Collection, Category, Tag, ProductLink                                                          |
| **Inventory**            | Stock per (variant, warehouse), reservations, ledger                                    | Warehouse, InventoryItem, StockReservation, StockAdjustment                                                                   |
| **Pricing & Promotions** | Money + discount rules (single-currency at launch)                                      | Coupon, Discount, PriceList (future), TaxRule (future)                                                                        |
| **Cart**                 | Guest & authenticated carts, items, merging                                             | Cart, CartItem, CartMerge (event)                                                                                             |
| **Checkout & Orders**    | Order placement, payments, shipments, refunds                                           | Order, OrderLine, OrderEvent, Payment, Refund, Shipment                                                                       |
| **Content (CMS)**        | Pages, hero, banners, navigation, FAQs, testimonials, announcements, media library, SEO | Page, PageBlock, HeroSection, Banner, NavigationMenu, NavigationItem, Faq, Testimonial, Announcement, Media, BlogPost, Author |
| **Customer Engagement**  | Wishlists, reviews, recently viewed, newsletter, addresses                              | Wishlist, Review, RecentlyViewed, NewsletterSubscription, CustomerAddress                                                     |
| **Platform**             | Audit, settings, feature flags, notifications, webhooks, background jobs                | AuditLog, Setting, FeatureFlag, Notification, Webhook, WebhookDelivery, BackgroundJob                                         |

Cross-context interaction is via the owning context's **application service**
or via **domain events** (see `event-model.md`). Direct table reads across
modules are forbidden (`monorepo-structure.md` §5).

---

## 2. Identity Context

Customer and AdminUser are **separate aggregates** with separate auth flows.

### 2.1 Customer aggregate

- **Root:** `Customer`
- **Entities/VOs:** `EmailAddress` (VO), `PasswordHash` (VO), `PersonName` (VO),
  `PhoneNumber` (VO).
- **Children of the Customer aggregate (lifecycle-bound):** `CustomerSession`,
  `CustomerRefreshToken`.
- **Independent aggregates that reference Customer:** `CustomerAddress`,
  `Wishlist`, `Review`, `RecentlyViewed`, `NewsletterSubscription`.

**Invariants:**

- Email is unique (case-insensitive) across non-deleted customers.
- Password hash is Argon2id; the model never holds the plaintext.
- Email verification status is tracked (`emailVerifiedAt`); unverified accounts
  can browse and add to cart but cannot checkout until verified (final rule
  confirmed in Stage 6).
- Status transitions: `Pending → Active → Suspended → Deleted (soft)`.

### 2.2 AdminUser aggregate

- **Root:** `AdminUser`
- **VOs:** `EmailAddress`, `PasswordHash`, `PersonName`.
- **Children:** `AdminSession`, `AdminRefreshToken`.
- **Related aggregates (RBAC):** `AdminRole`, `AdminPermission`,
  `AdminRolePermission` (junction), `AdminUserRole` (junction).

**Invariants:**

- Email unique across non-deleted admin users.
- MFA enrolment required for `admin` role (enforced in service layer; flag
  on AdminUser).
- A user has 1..N roles; each role has 1..N permissions; the effective
  permission set is the union.
- Permissions are **strings** of the form `<context>:<action>[:<scope>]`
  (e.g. `catalog:write`, `orders:read:any`).
- Default-deny: any controller method without an explicit `@Permissions(...)`
  decorator is denied.

### 2.3 Sessions & Refresh Tokens

- Both customer and admin variants are short-lived; storage detailed in
  `database-architecture.md` §13.
- A refresh token belongs to a single user, has a chain id, an expiry, and a
  revoked flag. Rotation issues a new token and revokes the previous one;
  reuse of a revoked token revokes the whole chain (token-reuse attack signal).

---

## 3. Catalog Context

### 3.1 Aggregates

- **`Product`** is the aggregate root. It owns `ProductVariant`,
  `ProductImage`, `ProductVideo`, `ProductDocument`, `ProductSpecification`.
- **`Collection`** is its own aggregate; references products through
  `ProductCollection` junction.
- **`Category`** is its own hierarchical aggregate; references products
  through `ProductCategory` junction.
- **`Tag`** is its own aggregate; junction `ProductTag`.
- **`Option` / `OptionValue`** live inside the Product aggregate (scoped to the
  product). `VariantOptionValue` is the junction binding a variant to its
  selected option values.
- **`ProductLink`** holds directional product↔product relationships with a
  `kind` discriminator: `related`, `crossSell`, `upsell`.

### 3.2 Invariants

- A `Product` always has ≥ 1 `ProductVariant` (the "default" variant for
  option-less products). The catalog never branches on "has variants?".
- A `ProductVariant` has exactly one combination of option-value selections;
  duplicates within a product are rejected (`(productId, optionFingerprint)` unique).
- `Product.slug` is unique among non-deleted products.
- `ProductVariant.sku` is unique among non-deleted variants when non-null.
- Status: `Draft → Published → Archived`. Archived hides from storefront but
  remains visible for historical orders.
- Removing a product soft-deletes all its variants in the same TX.

### 3.3 Pricing

- Price lives on `ProductVariant` (`priceAmount`, `priceCurrency`,
  optional `compareAtAmount`).
- The model is single-currency at launch; the currency column is preserved
  so a future `PriceList` aggregate can overlay per-currency / per-customer-group
  prices without altering Variant.

### 3.4 Media

- `ProductImage` / `ProductVideo` / `ProductDocument` reference `Media.id`
  in the CMS context. The Catalog context does **not** own the media bytes
  or metadata, only the linkage and ordering.

---

## 4. Inventory Context

### 4.1 Aggregates

- **`Warehouse`** — physical or logical stock location.
- **`InventoryItem`** — stock for a `(variantId, warehouseId)` pair.
- **`StockReservation`** — a hold against an `InventoryItem` tied to a cart
  or order line, with an expiry.
- **`StockAdjustment`** — append-only ledger row capturing every quantity change.

### 4.2 Invariants

- `InventoryItem.onHand ≥ 0`.
- `InventoryItem.reserved ≥ 0` and `reserved ≤ onHand` (available cannot go negative).
- "Available" is computed: `onHand − reserved`.
- Every change to `onHand` or `reserved` writes a `StockAdjustment` in the
  same DB transaction with `reason` ∈ {`reservation`, `release`, `order`,
  `return`, `manual`, `transfer-in`, `transfer-out`, `recount`}.
- A `StockReservation` has a TTL; expired reservations are released by a
  background job and produce a `release` adjustment.
- Variant ↔ InventoryItem is 1:N (one row per warehouse). Removing a variant
  blocks if any positive `onHand` exists; archived variants keep their rows
  for history.

### 4.3 Cross-context relationships

- Catalog publishes `VariantCreated`/`VariantDeleted`; Inventory listens to
  ensure an `InventoryItem` row exists for each warehouse marked default.
- Cart calls `InventoryService.reserve(variantId, qty)` (synchronous, in the
  checkout transaction).
- Orders call `InventoryService.commit(reservationId)` and `release(reservationId)`.

---

## 5. Pricing & Promotions Context

### 5.1 Aggregates

- **`Coupon`** — code-based discount: type (`percentage` | `fixed`), value,
  min order amount, max uses, per-customer uses, scope (whole order / specific
  products / collections), validity window.
- **`Discount`** — automatic, rule-based promotion (e.g. "10% off Walnut
  collection"). Same shape as Coupon minus the code.
- **`PriceList`** (future) — currency or customer-group price overlays.
  Designed-for, not built at launch.
- **`TaxRule`** (future) — manual rules or provider-driven; deferred.

### 5.2 Invariants

- Coupons are case-insensitive but stored uppercased.
- A coupon's `redemptionCount` is incremented atomically inside the order
  TX, gated by `maxUses`. Concurrent redemptions race-safely via row lock.
- A `CouponRedemption` row records each successful use (`(couponId, orderId, customerId, redeemedAt)`).
- Discount math is computed once at checkout and **snapshotted** on the
  order line (`discountAllocationAmount`) so later rule changes don't restate
  history.

---

## 6. Cart Context

### 6.1 Aggregates

- **`Cart`** is the aggregate root. Owns `CartItem`.
- A cart belongs to either a `Customer` (via `customerId`) **or** an anonymous
  visitor (via `guestToken`). Exactly one of those is non-null.
- A cart has `status` ∈ {`Active`, `Merged`, `Abandoned`, `Converted`,
  `Expired`}.

### 6.2 Invariants

- A customer has **at most one** `Active` cart (`UNIQUE WHERE status='Active' AND customerId NOT NULL`).
- A guestToken has at most one `Active` cart.
- `CartItem (cartId, variantId)` is unique — adding the same variant
  increments quantity, never inserts a duplicate row.
- Quantity ≥ 1; setting to 0 deletes the line.
- Items snapshot the variant's `priceAmount`/`priceCurrency` at the moment of
  add — display price honours snapshot. Final price is re-resolved at
  checkout to defend against tampering.

### 6.3 Merge operation (locked decision §4)

On sign-in, if both a guest cart (matched by `guestToken` cookie) and an
active customer cart exist:

1. Validate both carts.
2. For each guest `CartItem`:
   - If the customer cart has the same `variantId`, sum quantities (capped by
     a configured per-line max).
   - Otherwise insert a new line on the customer cart, copying snapshot fields.
3. Mark the guest cart `Merged` and record `mergedIntoCartId`.
4. Emit `CartMerged` event.

The merge is one DB transaction. Idempotency key: the guest token.

### 6.4 Cross-context relationships

- On checkout submit, Cart hands control to Checkout & Orders, which reads
  the cart, calls Inventory to reserve, calls Payments, then transitions the
  cart to `Converted` with `convertedOrderId`.

---

## 7. Checkout & Orders Context

### 7.1 Aggregates

- **`Order`** is the aggregate root. Owns `OrderLine`, `OrderEvent`,
  `Shipment` (1..N), `Refund` (0..N).
- **`Payment`** is a sibling aggregate — `Payment.orderId` references the
  order, but Payment has its own lifecycle (attempts, retries, refunds).

### 7.2 Invariants

- An order is immutable in committed fields after `placedAt` is set
  (customer email, billing/shipping address snapshot, currency, totals).
  Mutations after placement go through child rows (`OrderEvent`,
  `Shipment`, `Refund`) and a small set of admin-controlled status fields.
- Status: `Pending → AwaitingPayment → Paid → Fulfilling → Shipped →
Completed`, with branches `Cancelled` and `Refunded` (partial or full).
- `OrderLine` snapshots the variant (`variantTitle`, `productTitle`, `sku`,
  `unitPriceAmount`, `unitPriceCurrency`, `discountAllocationAmount`,
  `taxAmount`) so the order is historically faithful even if the product
  changes later.
- An order is associated with **exactly one** customer at placement (guests
  are upgraded to a "guest customer" record at checkout — a `Customer` row
  with `isGuest=true` — to keep the FK uniform).
- Totals are computed at placement and stored: `subtotalAmount`,
  `discountAmount`, `shippingAmount`, `taxAmount`, `totalAmount`. The sum
  reconciles to the line snapshots.
- `humanRef` (e.g. `OFD-2026-0001`) is generated at placement and is
  unique forever (no reuse, even after delete).

### 7.3 Payment aggregate (locked decision §5)

- **Root:** `Payment` — provider-agnostic.
- **Children:** `Refund`.
- Fields: `provider` (`stripe`, …), `providerPaymentId`,
  `providerCustomerId?`, `providerData jsonb`, `status`, `amount`, `currency`,
  `capturedAt?`, `failureReason?`.
- An order may accumulate multiple Payment rows (failed attempt + successful
  retry). The order's "paid" status is derived from at least one `succeeded`
  payment summing to the order total.
- Refunds reference Payment, sum across refunds ≤ payment amount.

### 7.4 Shipments

- One or many `Shipment` rows per order (split fulfilment supported).
- Each shipment references a subset of `OrderLine` ids and a quantity per line.
- Carries `carrier`, `trackingNumber`, `shippedAt`, `deliveredAt?`.
- Shipping rates/labels integration is post-launch; the model supports it.

---

## 8. Content (CMS) Context

### 8.1 Aggregates

- **`Page`** is the aggregate root for generic CMS pages, including landing
  pages (distinguished by `template`). Owns ordered `PageBlock` rows with a
  `type` discriminator and `data jsonb` payload.
- **`HeroSection`, `PromotionalBanner`, `Announcement`, `Testimonial`, `Faq`**
  are first-class reusable content entities. They are stand-alone aggregates
  that pages reference by id inside `PageBlock.data`.
- **`NavigationMenu`** owns hierarchical `NavigationItem` rows.
- **`BlogPost`** + **`Author`** are their own aggregates.
- **`Media`** is the central asset library aggregate. Everything that displays
  an image/video references `Media.id`, never a URL.

### 8.2 Invariants

- `Page.slug` is unique within `(locale, template)` (locale is `en` only at
  launch but stored for forward-compat).
- A page transitions `Draft → Scheduled → Published → Archived`.
- `publishedAt` must be ≤ now to appear on the storefront.
- Reusable blocks (Hero/Banner/Faq/etc.) referenced by a published page cannot
  be hard-deleted; they soft-delete and pages render with a placeholder until
  edited.
- `Media` rows hold the canonical S3 key + derivatives (`variants jsonb`
  listing generated sizes/formats).

### 8.3 SEO

- SEO fields (`metaTitle`, `metaDescription`, `ogImageMediaId`, `canonicalUrl`,
  `noIndex`) live as nullable columns directly on Page, Product, Collection,
  Category, and BlogPost. Empty fields fall back to entity defaults at render
  time.

---

## 9. Customer Engagement Context

### 9.1 Aggregates

- **`CustomerAddress`** — billing/shipping addresses per customer; one may be
  `isDefaultShipping`, one `isDefaultBilling`.
- **`Wishlist`** — `(customerId, productId)` rows; uniqueness enforced.
  Optional `Note` field.
- **`Review`** — customer review on a product; `rating` 1–5, `title`, `body`,
  `status` ∈ {`Pending`, `Published`, `Rejected`}, `publishedAt?`. Anti-abuse
  rules in the service (one review per (customer, product) by default).
- **`RecentlyViewed`** — capped per customer (e.g. 50); insertion bumps
  `viewedAt`. Cleaned up by background job.
- **`NewsletterSubscription`** — email + optional `customerId`. Double opt-in
  via signed token. Status: `Pending → Confirmed → Unsubscribed`.

### 9.2 Invariants

- An address can be soft-deleted only if no in-flight orders reference it
  by snapshot? No — orders snapshot the address into `Order.shippingAddress`
  JSONB, so deleting the address row is safe.
- A wishlist entry is unique per `(customerId, productId)`.
- A review's `status` may only transition forward (`Pending → Published` or
  `Pending → Rejected`); admin write.

---

## 10. Platform Context

### 10.1 Aggregates

- **`AuditLog`** — append-only; see `database-architecture.md` §6.
- **`Setting`** — typed key/value (Zod-validated at read).
- **`FeatureFlag`** — `key`, `value` (`boolean | string`), `audience`
  (`global` | `staffOnly` | `percentRollout(p)`), `description`.
- **`Notification`** — in-app for admin users initially.
- **`Webhook`** — subscription record: `url`, `secret`, `events` (string[]),
  `active`, `createdByAdminUserId`.
- **`WebhookDelivery`** — per-attempt delivery log; `webhookId`, `event`,
  `payload jsonb`, `responseStatus?`, `responseBody?`, `attempt`,
  `deliveredAt?`, `nextAttemptAt?`.
- **`BackgroundJob`** — durable mirror of Redis BullMQ jobs for observability.

### 10.2 Invariants

- `AuditLog`, `WebhookDelivery`, `BackgroundJob` are append-only.
- `Setting.key` is unique and conforms to a registered schema; unknown keys
  rejected at write.
- `FeatureFlag.key` is unique.
- `Webhook.secret` is generated server-side, shown once at creation, stored
  hashed thereafter. HMAC-SHA256 signs deliveries.

---

## 11. Value Objects (cross-context)

A handful of VOs recur across contexts. They are TypeScript types (or Zod
schemas) in `packages/types`, not separate tables:

- `Money { amount: bigint; currency: 'USD' }` — single launch currency.
- `Address { line1; line2?; city; region?; postalCode; country; phone? }`.
- `EmailAddress` (lowercased, RFC-compliant).
- `Slug` (kebab-case, length-bound).
- `HumanRef` (prefix + year + sequence, e.g. `OFD-2026-0001`).
- `Pagination { cursor?; limit }` — see `api-conventions.md`.

---

## 12. Aggregate Reference Rules

To prevent the model from collapsing into a graph of cross-context FKs:

- **Identity is referenced by id only.** Catalog/Cart/Order rows hold a bare
  `customerId` or `adminUserId` UUID. No FK relations are declared in Prisma
  that would tempt eager joins; service-layer joins fetch the customer DTO.
  (Exception: Customer Engagement context, which is tightly bound to a
  customer and uses real FKs.)
- **Catalog is referenced by id only** from Cart/Order. Snapshot data lives on
  CartItem/OrderLine so deletions/edits don't break history.
- **Media is referenced by id** from everywhere. Never store URLs.
- **Cross-context state changes go through events** (see `event-model.md`),
  not synchronous calls into another module's repository.

---

## 13. Multi-Tenancy / B2B Readiness

Out of scope at launch, but the model leaves space:

- `CustomerGroup` table (post-launch) → enables price lists and gated content.
- `Account` table (post-launch) → company-level grouping of customers, for
  PO-based purchasing and bulk approvals.
- All catalog reads already flow through a `CatalogContext` service signature
  that can accept a `customerGroupId` for price-list resolution.
- Inventory model already supports per-warehouse stock and transfers, which
  underpins B2B fulfilment without redesign.

---

## 14. What Is Deliberately Excluded From Stage 3

- Order returns workflow (RMA) — modelled at a high level
  (`Order.status='Refunded'`, `Refund` rows) but the full RMA aggregate is
  Stage 7.
- Loyalty / gift cards — not in scope; the discount layer is structured to
  accept a `giftCard` discount type later.
- Subscriptions / recurring orders — out of scope.
- Multi-language content — schema reserves `locale` columns where useful but
  no translation tables are created at launch.
