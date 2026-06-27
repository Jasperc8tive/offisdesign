# Entity-Relationship Diagram

Stage 3 ERD. Diagrams are rendered as ASCII per `coding-standards.md` §10
(stable across viewers). Each context has its own diagram; cross-context
references are shown by id-only edges in §11.

Cardinality notation: `1`, `0..1`, `1..*`, `0..*`. Cascade rules are listed
beside the edge: `CASCADE`, `RESTRICT`, `SET NULL`, `NO ACTION`. Soft-deletes
are not shown on the diagram (see `database-architecture.md` §5).

Every entity has `id (uuid v7, PK)`, `created_at`, `updated_at`, and (where
applicable) `deleted_at`; those columns are omitted in the diagrams to keep
them readable.

---

## 1. Identity — Customer side

```
┌─────────────────────────┐
│ Customer                │
│─────────────────────────│
│ id                  PK  │
│ email          UNIQUE   │
│ password_hash           │
│ first_name              │
│ last_name               │
│ phone                   │
│ email_verified_at       │
│ is_guest         BOOL   │
│ status           ENUM   │
└────┬────────────────────┘
     │ 1
     │
     │ 0..*               ┌─────────────────────────┐
     ├───────────────────▶│ CustomerAddress         │  CASCADE on Customer
     │                    │ customer_id        FK   │  delete
     │                    │ line1, city, country... │
     │                    │ is_default_shipping     │
     │                    │ is_default_billing      │
     │                    └─────────────────────────┘
     │
     │ 0..*               ┌─────────────────────────┐
     ├───────────────────▶│ CustomerSession         │  CASCADE
     │                    │ customer_id        FK   │
     │                    │ user_agent, ip          │
     │                    │ expires_at              │
     │                    └─────────────────────────┘
     │
     │ 0..*               ┌─────────────────────────┐
     ├───────────────────▶│ CustomerRefreshToken    │  CASCADE
     │                    │ customer_id        FK   │
     │                    │ chain_id    UUID        │
     │                    │ token_hash              │
     │                    │ revoked_at              │
     │                    │ expires_at              │
     │                    └─────────────────────────┘
     │
     │ 0..*               ┌─────────────────────────┐
     ├───────────────────▶│ Wishlist                │  CASCADE
     │                    │ customer_id  FK         │
     │                    │ product_id   FK (id)    │  (no FK ref to Catalog)
     │                    │ note                    │
     │                    │ UNIQUE(customer, prod)  │
     │                    └─────────────────────────┘
     │
     │ 0..*               ┌─────────────────────────┐
     ├───────────────────▶│ Review                  │  RESTRICT (admin
     │                    │ customer_id    FK       │   must moderate)
     │                    │ product_id     UUID     │
     │                    │ rating, title, body     │
     │                    │ status         ENUM     │
     │                    └─────────────────────────┘
     │
     │ 0..*               ┌─────────────────────────┐
     ├───────────────────▶│ RecentlyViewed          │  CASCADE
     │                    │ customer_id  FK         │
     │                    │ product_id   UUID       │
     │                    │ viewed_at               │
     │                    └─────────────────────────┘
     │
     │ 0..1               ┌─────────────────────────┐
     └───────────────────▶│ NewsletterSubscription  │  SET NULL
                          │ customer_id  FK (null)  │
                          │ email        UNIQUE     │
                          │ status         ENUM     │
                          └─────────────────────────┘
```

---

## 2. Identity — Admin side

```
┌─────────────────────────┐
│ AdminUser               │
│─────────────────────────│
│ id                PK    │
│ email           UNIQUE  │
│ password_hash           │
│ first_name              │
│ last_name               │
│ mfa_enabled  BOOL       │
│ mfa_secret              │
│ status            ENUM  │
└────┬────────────────────┘
     │ 1
     │                                       1
     │ 0..*  ┌────────────────────────┐      ┌────────────────────────┐
     ├──────▶│ AdminUserRole          │◀─────│ AdminRole              │
     │       │ admin_user_id  FK      │ 0..* │ id              PK     │
     │       │ role_id        FK      │      │ key      UNIQUE        │
     │       │ PK(admin_user, role)   │      │ name                   │
     │       └────────────────────────┘      └────────┬───────────────┘
     │                                                │ 1
     │                                                │
     │                                                │ 0..*
     │                                          ┌─────▼───────────────┐
     │                                          │ AdminRolePermission │
     │                                          │ role_id        FK   │
     │                                          │ permission_id  FK   │
     │                                          │ PK(role, perm)      │
     │                                          └─────┬───────────────┘
     │                                                │ 0..*
     │                                                │
     │                                                │ 1
     │                                          ┌─────▼───────────────┐
     │                                          │ AdminPermission     │
     │                                          │ id              PK  │
     │                                          │ key   UNIQUE        │  e.g. catalog:write
     │                                          │ description         │
     │                                          └─────────────────────┘
     │
     │ 0..*               ┌─────────────────────────┐
     ├───────────────────▶│ AdminSession            │  CASCADE
     │                    │ admin_user_id      FK   │
     │                    └─────────────────────────┘
     │
     │ 0..*               ┌─────────────────────────┐
     └───────────────────▶│ AdminRefreshToken       │  CASCADE
                          │ admin_user_id      FK   │
                          └─────────────────────────┘
```

All AdminUserRole / AdminRolePermission junction FKs cascade.

---

## 3. Catalog

```
┌──────────────────────────┐
│ Product                  │
│──────────────────────────│
│ id                  PK   │
│ slug         UNIQUE      │
│ title                    │
│ description              │
│ status            ENUM   │
│ search_vector  TSVECTOR  │
│ seo_meta_title           │
│ seo_meta_description     │
│ seo_og_media_id   UUID   │  (→ Media.id, no FK)
└──────┬──────────┬────────┘
       │ 1        │ 1
       │          │
       │ 1..*     │ 0..*
┌──────▼───────┐  │  ┌───────────────────────┐
│ ProductVariant│  │  │ Option                │  CASCADE
│ id         PK │  └─▶│ product_id      FK    │
│ product_id FK │     │ name (Size, Material) │
│ sku  UNIQUE?  │     │ position              │
│ price_amount  │     └────────┬──────────────┘
│ price_currency│              │ 1
│ compare_at_amt│              │ 0..*
│ position      │              │
└──────┬────────┘     ┌────────▼──────────────┐
       │ 1            │ OptionValue           │  CASCADE
       │              │ option_id        FK   │
       │ 0..*         │ value (Large, Oak)    │
┌──────▼──────────────▶ position              │
│ VariantOptionValue  │└────────┬──────────────┘
│ variant_id    FK    │         │ 1
│ option_id     FK    │         │ 0..*
│ option_value_id FK  │◀────────┘
│ PK(variant, option) │   CASCADE
│ UNIQUE(variant, opt)│
└─────────────────────┘

┌──────────────────────────┐    ┌──────────────────────────┐
│ ProductImage             │    │ ProductVideo             │
│ product_id      FK       │    │ product_id      FK       │
│ media_id        UUID     │    │ media_id        UUID     │
│ alt                      │    │ position                 │
│ position                 │    └──────────────────────────┘
└──────────────────────────┘
┌──────────────────────────┐    ┌──────────────────────────┐
│ ProductDocument          │    │ ProductSpecification     │
│ product_id      FK       │    │ product_id      FK       │
│ media_id        UUID     │    │ label, value             │
│ label                    │    │ position                 │
└──────────────────────────┘    └──────────────────────────┘
All four cascade on Product delete.

┌──────────────────────────┐
│ ProductLink              │   (related / cross-sell / up-sell)
│ source_product_id   FK   │   CASCADE
│ target_product_id   UUID │   no FK (forward-compat cross-store)
│ kind            ENUM     │
│ position                 │
│ UNIQUE(source,target,kind│
└──────────────────────────┘
```

### 3.1 Grouping

```
┌─────────────────┐        ┌───────────────────┐        ┌────────────────────┐
│ Collection      │        │ ProductCollection │        │ Product            │
│ id          PK  │ 1   0.*│ collection_id  FK │ 0..*  1│ id           PK    │
│ slug    UNIQUE  │────────│ product_id     FK │────────│                    │
│ title           │        │ PK(coll,product)  │        │                    │
│ type ENUM       │        └───────────────────┘        └────────────────────┘
│  (manual|rule)  │
│ rules  JSONB    │
└─────────────────┘                CASCADE both sides

┌─────────────────┐        ┌───────────────────┐
│ Category        │        │ ProductCategory   │
│ id          PK  │        │ category_id    FK │
│ parent_id   FK? │◀──┐    │ product_id     FK │
│ slug    UNIQUE  │   │    │ PK(cat, product)  │
└──────┬──────────┘   │    └───────────────────┘
       │ 1            │ self-ref RESTRICT to prevent
       │ 0..*         │ orphaning subtrees
       └──────────────┘

┌─────────────────┐        ┌───────────────────┐
│ Tag             │        │ ProductTag        │
│ id          PK  │        │ tag_id      FK    │  CASCADE
│ slug    UNIQUE  │────────│ product_id  FK    │
└─────────────────┘        │ PK(tag, product)  │
                           └───────────────────┘
```

---

## 4. Inventory

```
┌────────────────────────┐
│ Warehouse              │
│ id                 PK  │
│ code         UNIQUE    │
│ name                   │
│ address     JSONB      │
│ is_active   BOOL       │
└─────┬──────────────────┘
      │ 1
      │
      │ 0..*
┌─────▼─────────────────────────┐
│ InventoryItem                 │   RESTRICT on Warehouse delete
│ id                       PK   │   (cannot delete warehouse with stock)
│ warehouse_id     FK           │
│ variant_id       UUID         │   (→ ProductVariant.id, no FK)
│ on_hand          INT          │
│ reserved         INT          │
│ incoming         INT          │
│ version          INT          │
│ UNIQUE(warehouse, variant)    │
└─────┬─────────────────────────┘
      │ 1
      │
      │ 0..*                                       0..*  ┌────────────────────┐
┌─────▼─────────────────┐        ┌────────────────────┐  │ (Cart.id /         │
│ StockReservation      │        │ StockAdjustment    │  │  OrderLine.id)     │
│ inventory_item_id  FK │CASCADE │ inventory_item_id  │  └────────────────────┘
│ qty             INT   │        │   FK (RESTRICT)    │
│ reason          ENUM  │        │ delta           INT│
│ expires_at            │        │ on_hand_after  INT │
│ cart_id     UUID?     │        │ reserved_after INT │
│ order_line_id UUID?   │        │ reason         ENUM│
│ status         ENUM   │        │ actor_type     ENUM│
└───────────────────────┘        │ actor_id       UUID│
                                 │ related_entity_type│
                                 │ related_entity_id  │
                                 └────────────────────┘
```

`StockAdjustment` is append-only (no soft delete, no updates).

---

## 5. Pricing & Promotions

```
┌─────────────────────────┐
│ Coupon                  │
│ id                 PK   │
│ code         UNIQUE     │   uppercased
│ type           ENUM     │   percentage | fixed
│ value          INT      │   percent (0–100) or minor units
│ scope          ENUM     │   order | products | collections
│ min_order_amount INT?   │
│ max_uses      INT?      │
│ max_uses_per_customer ?│
│ starts_at TIMESTAMPTZ?  │
│ ends_at   TIMESTAMPTZ?  │
│ status         ENUM     │
└────┬────────────────────┘
     │ 1
     │
     │ 0..*               ┌──────────────────────────┐
     ├───────────────────▶│ CouponProduct            │  CASCADE
     │                    │ coupon_id   FK           │
     │                    │ product_id  UUID         │
     │                    │ PK(coupon, product)      │
     │                    └──────────────────────────┘
     │
     │ 0..*               ┌──────────────────────────┐
     ├───────────────────▶│ CouponCollection         │  CASCADE
     │                    │ coupon_id    FK          │
     │                    │ collection_id  UUID      │
     │                    │ PK(coupon, collection)   │
     │                    └──────────────────────────┘
     │
     │ 0..*               ┌──────────────────────────┐
     └───────────────────▶│ CouponRedemption         │  CASCADE
                          │ coupon_id   FK           │
                          │ order_id    UUID         │
                          │ customer_id UUID?        │
                          │ redeemed_at              │
                          │ amount_applied  INT      │
                          └──────────────────────────┘

┌─────────────────────────┐
│ Discount                │  (automatic; same scopes/rules; no code)
│ id                 PK   │
│ type, value, scope...   │
│ priority         INT    │
│ rules        JSONB      │
└─────────────────────────┘
```

`PriceList` / `TaxRule` reserved for future stages.

---

## 6. Cart

```
┌──────────────────────────────┐
│ Cart                         │
│ id                       PK  │
│ customer_id  UUID?           │  (→ Customer.id, no FK)
│ guest_token  TEXT?  UNIQUE   │
│ status              ENUM     │  Active|Merged|Abandoned|Converted|Expired
│ currency       CHAR(3)       │
│ merged_into_cart_id UUID?    │
│ converted_order_id  UUID?    │
│ version          INT         │
│ CHECK (customer_id IS NOT NULL│
│      OR guest_token IS NOT N)│
└────┬─────────────────────────┘
     │ 1
     │
     │ 1..*
┌────▼────────────────────────┐
│ CartItem                    │  CASCADE on Cart delete
│ cart_id          FK         │
│ variant_id       UUID       │  (→ ProductVariant.id, no FK)
│ product_id       UUID       │
│ qty              INT        │
│ unit_price_amount  BIGINT   │  snapshot
│ unit_price_currency CHAR(3) │
│ added_at                    │
│ UNIQUE(cart_id, variant_id) │
└─────────────────────────────┘
```

Partial unique: `(customer_id) WHERE status='Active'`.
Partial unique: `(guest_token) WHERE status='Active'`.

---

## 7. Checkout & Orders

```
┌─────────────────────────────────┐
│ Order                           │
│ id                          PK  │
│ human_ref         UNIQUE        │
│ customer_id       UUID          │
│ status                 ENUM     │
│ currency           CHAR(3)      │
│ subtotal_amount        BIGINT   │
│ discount_amount        BIGINT   │
│ shipping_amount        BIGINT   │
│ tax_amount             BIGINT   │
│ total_amount           BIGINT   │
│ shipping_address     JSONB      │  snapshot
│ billing_address      JSONB      │  snapshot
│ placed_at                       │
│ version                INT      │
└────┬───────────┬────────────┬───┘
     │ 1         │ 1          │ 1
     │           │            │
     │ 1..*      │ 0..*       │ 0..*
┌────▼────────┐ ┌▼───────────┐ ┌▼───────────────┐
│ OrderLine   │ │ OrderEvent │ │ Shipment       │   all CASCADE
│ order_id FK │ │ order_id FK│ │ order_id FK    │
│ variant_id  │ │ type ENUM  │ │ carrier        │
│ product_id  │ │ data JSONB │ │ tracking_no    │
│ qty INT     │ │ actor_*    │ │ shipped_at     │
│ unit_price_amt│ └────────────┘ │ delivered_at   │
│ unit_price_cur│                └────────┬───────┘
│ discount_alloc│                         │ 1
│ tax_amount    │                         │ 0..*
│ variant_title │                  ┌──────▼───────────┐
│ product_title │                  │ ShipmentLine     │
│ sku           │                  │ shipment_id  FK  │  CASCADE
└─────┬─────────┘                  │ order_line_id FK │  RESTRICT
      │ 1                          │ qty          INT │
      │                            └──────────────────┘
      │ 0..*  (one reservation per line at most)
      │
┌─────▼────────────────┐
│ StockReservation     │  (lives in Inventory; back-ref by id)
└──────────────────────┘

┌───────────────────────┐
│ Payment               │
│ id                PK  │
│ order_id        FK    │  RESTRICT (cannot delete order with payments)
│ provider     ENUM     │
│ provider_payment_id   │
│ provider_data  JSONB  │
│ amount         BIGINT │
│ currency      CHAR(3) │
│ status         ENUM   │
│ captured_at           │
│ failure_reason        │
└────┬──────────────────┘
     │ 1
     │
     │ 0..*
┌────▼──────────────────┐
│ Refund                │  CASCADE on Payment delete
│ payment_id  FK        │
│ amount    BIGINT      │
│ currency  CHAR(3)     │
│ reason                │
│ provider_refund_id    │
│ status    ENUM        │
└───────────────────────┘
```

---

## 8. Content (CMS)

```
┌──────────────────────────┐
│ Page                     │
│ id                  PK   │
│ slug                     │
│ locale     CHAR(2)       │
│ template          ENUM   │  default | landing | other
│ status            ENUM   │  Draft|Scheduled|Published|Archived
│ title                    │
│ published_at             │
│ search_vector TSVECTOR   │
│ seo_*                    │
│ UNIQUE(slug, locale,     │
│        template)         │
└────┬─────────────────────┘
     │ 1
     │
     │ 0..*
┌────▼─────────────────────┐
│ PageBlock                │   CASCADE
│ page_id        FK        │
│ position       INT       │
│ type           ENUM      │   hero | banner | testimonial |
│ data           JSONB     │   faq | richtext | productGrid | ...
│ ref_entity_type ENUM?    │   (when block embeds reusable entity)
│ ref_entity_id   UUID?    │
└──────────────────────────┘

┌──────────────────────────┐    ┌──────────────────────────┐
│ HeroSection              │    │ PromotionalBanner        │
│ id                  PK   │    │ id                  PK   │
│ title, subtitle          │    │ message                  │
│ cta_label, cta_href      │    │ starts_at, ends_at       │
│ media_id            UUID │    │ placement       ENUM     │
│ status            ENUM   │    │ status            ENUM   │
└──────────────────────────┘    └──────────────────────────┘
┌──────────────────────────┐    ┌──────────────────────────┐
│ Announcement             │    │ Testimonial              │
│ id                  PK   │    │ id                  PK   │
│ body                     │    │ author_name              │
│ severity         ENUM    │    │ author_title             │
│ starts_at, ends_at       │    │ body, rating             │
└──────────────────────────┘    │ media_id            UUID │
                                └──────────────────────────┘
┌──────────────────────────┐
│ Faq                      │
│ id                  PK   │
│ category                 │
│ question, answer         │
│ position           INT   │
└──────────────────────────┘

┌──────────────────────────┐        ┌──────────────────────────┐
│ NavigationMenu           │        │ NavigationItem           │
│ id                  PK   │ 1   0.*│ menu_id          FK      │ CASCADE
│ key       UNIQUE         │────────│ parent_id        FK?     │ self-ref RESTRICT
│ name                     │        │ label                    │
└──────────────────────────┘        │ href                     │
                                    │ position           INT    │
                                    │ ref_entity_type    ENUM?  │
                                    │ ref_entity_id      UUID?  │
                                    └──────────────────────────┘

┌──────────────────────────┐        ┌──────────────────────────┐
│ Author                   │        │ BlogPost                 │
│ id                  PK   │ 1   0.*│ id                  PK   │ RESTRICT
│ name, bio, media_id      │────────│ author_id        FK      │ on Author delete
└──────────────────────────┘        │ slug      UNIQUE         │
                                    │ status     ENUM          │
                                    │ published_at             │
                                    │ search_vector TSVECTOR   │
                                    │ seo_*                    │
                                    └──────────────────────────┘

┌──────────────────────────┐
│ Media                    │
│ id                  PK   │
│ kind          ENUM       │  image | video | document
│ s3_key      UNIQUE       │
│ mime_type                │
│ width, height (image)    │
│ duration_ms (video)      │
│ variants       JSONB     │  derivative renditions
│ alt_text                 │
└──────────────────────────┘
```

---

## 9. Platform

```
┌──────────────────────────┐    ┌──────────────────────────┐
│ AuditLog (append-only)   │    │ Setting                  │
│ id                  PK   │    │ key       UNIQUE         │
│ actor_type      ENUM     │    │ value         JSONB      │
│ actor_id        UUID?    │    │ updated_by_admin_id UUID │
│ action                   │    └──────────────────────────┘
│ entity_type     ENUM     │
│ entity_id       UUID     │    ┌──────────────────────────┐
│ before          JSONB    │    │ FeatureFlag              │
│ after           JSONB    │    │ key       UNIQUE         │
│ request_id               │    │ value         JSONB      │
│ ip, user_agent           │    │ audience       ENUM      │
└──────────────────────────┘    │ description              │
                                └──────────────────────────┘

┌──────────────────────────┐    ┌──────────────────────────┐
│ Notification             │    │ Webhook                  │
│ id                  PK   │    │ id                  PK   │
│ recipient_type   ENUM    │    │ url                      │
│ recipient_id     UUID    │    │ secret_hash              │
│ kind              ENUM   │    │ events       TEXT[]      │
│ payload         JSONB    │    │ is_active   BOOL         │
│ read_at                  │    │ created_by_admin_id  FK  │
└──────────────────────────┘    └────────┬─────────────────┘
                                         │ 1
                                         │
                                         │ 0..*
                                ┌────────▼─────────────────┐
                                │ WebhookDelivery          │ CASCADE
                                │ webhook_id      FK       │ append-only
                                │ event                    │
                                │ payload         JSONB    │
                                │ response_status  INT?    │
                                │ response_body   TEXT?    │
                                │ attempt          INT     │
                                │ delivered_at             │
                                │ next_attempt_at          │
                                └──────────────────────────┘

┌──────────────────────────┐
│ BackgroundJob            │   append-only mirror of Redis queue
│ id                  PK   │
│ queue                    │
│ name                     │
│ payload         JSONB    │
│ status           ENUM    │
│ attempts          INT    │
│ failed_reason            │
│ scheduled_for            │
│ completed_at             │
└──────────────────────────┘
```

---

## 10. Cross-Context Reference Map

Per `domain-model.md` §12, references across contexts are **id-only** (no
declared Prisma relations) except in Customer Engagement, which is bound
to Customer. Summary:

```
Cart      ─ customer_id ────→ Customer (id-only)
Cart      ─ variant_id  ────→ ProductVariant (id-only)
Order     ─ customer_id ────→ Customer (id-only)
OrderLine ─ variant_id  ────→ ProductVariant (id-only)
OrderLine ─ product_id  ────→ Product (id-only)
Payment   ─ order_id    ────→ Order (FK, RESTRICT)
Inventory ─ variant_id  ────→ ProductVariant (id-only)
Inventory ─ warehouse_id────→ Warehouse (FK, RESTRICT)
Wishlist  ─ customer_id ────→ Customer (FK, CASCADE)
Wishlist  ─ product_id  ────→ Product (id-only)
Review    ─ customer_id ────→ Customer (FK, RESTRICT)
Review    ─ product_id  ────→ Product (id-only)
PageBlock ─ ref_entity_id ──→ Hero/Banner/Faq/Testimonial (id-only, polymorphic)
NavigationItem ─ ref_entity_id ──→ Page/Product/Collection/Category (id-only)
*         ─ media_id    ────→ Media (id-only)
AuditLog  ─ entity_id   ────→ <any> (id-only, polymorphic)
```

This keeps Prisma's query planner from blurring module boundaries and lets us
split modules into independent deployables later without unwinding relations.

---

## 11. Cascade Rules Summary

| Edge                                                                  | On parent delete               |
| --------------------------------------------------------------------- | ------------------------------ |
| Customer → CustomerAddress                                            | CASCADE                        |
| Customer → Customer{Session,RefreshToken}                             | CASCADE                        |
| Customer → Wishlist / RecentlyViewed                                  | CASCADE                        |
| Customer → Review                                                     | RESTRICT (admin must moderate) |
| Customer → NewsletterSubscription                                     | SET NULL                       |
| AdminUser → Admin{Session,RefreshToken,UserRole}                      | CASCADE                        |
| AdminRole → AdminRolePermission / AdminUserRole                       | CASCADE                        |
| Product → Variant / Image / Video / Document / Specification / Option | CASCADE                        |
| Option → OptionValue / VariantOptionValue                             | CASCADE                        |
| Collection → ProductCollection                                        | CASCADE                        |
| Category → self (parent)                                              | RESTRICT                       |
| Tag → ProductTag                                                      | CASCADE                        |
| Warehouse → InventoryItem                                             | RESTRICT                       |
| InventoryItem → StockReservation                                      | CASCADE                        |
| InventoryItem → StockAdjustment                                       | RESTRICT (append-only history) |
| Cart → CartItem                                                       | CASCADE                        |
| Order → OrderLine / OrderEvent / Shipment                             | CASCADE                        |
| Order → Payment                                                       | RESTRICT                       |
| Payment → Refund                                                      | CASCADE                        |
| Shipment → ShipmentLine                                               | CASCADE                        |
| Page → PageBlock                                                      | CASCADE                        |
| NavigationMenu → NavigationItem                                       | CASCADE                        |
| Author → BlogPost                                                     | RESTRICT                       |
| Webhook → WebhookDelivery                                             | CASCADE                        |
| Coupon → CouponProduct / CouponCollection / CouponRedemption          | CASCADE                        |
