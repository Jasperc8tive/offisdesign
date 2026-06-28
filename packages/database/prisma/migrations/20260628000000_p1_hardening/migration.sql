-- Production-readiness hardening migration.
--
-- Adds:
--   1. version columns on mutable models for optimistic locking
--      (Order, Customer, AdminUser, ProductVariant, Discount).
--   2. idempotency_key columns on delivery tables so retries are deduped.
--   3. CHECK constraint on discount.value so percent/fixed semantics can't drift.
--   4. Partial indexes WHERE deleted_at IS NULL on hot soft-deletable tables.
--
-- Backfill strategy:
--   New columns default to 0 / NULL — no row rewriting needed; safe on a live DB.

-- 1. version columns -------------------------------------------------------
ALTER TABLE "admin_user"       ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "customer"         ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "product_variant"  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "order"            ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "discount"         ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

-- 2. idempotency_key columns ----------------------------------------------
ALTER TABLE "webhook_delivery"      ADD COLUMN "idempotency_key" TEXT;
ALTER TABLE "notification_delivery" ADD COLUMN "idempotency_key" TEXT;

CREATE UNIQUE INDEX "webhook_delivery_idempotency_key_key"
  ON "webhook_delivery" ("idempotency_key");
CREATE UNIQUE INDEX "notification_delivery_idempotency_key_key"
  ON "notification_delivery" ("idempotency_key");

-- 3. Discount.value semantic guard ----------------------------------------
-- Percent: 0..10000 (basis points). Fixed: must be positive minor units.
ALTER TABLE "discount"
  ADD CONSTRAINT "discount_value_range_chk"
  CHECK (
    (kind = 'PERCENT' AND value >= 0     AND value <= 10000) OR
    (kind = 'FIXED'   AND value >  0)
  );

-- 4. Partial indexes on active (non-soft-deleted) rows --------------------
-- These accelerate the common "active rows only" queries without bloating
-- the index with tombstones. The unqualified @@index([deletedAt]) is kept
-- because reverse lookups (e.g. admin "show deleted") still need it.
CREATE INDEX "product_active_idx"
  ON "product" ("status", "published_at")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "product_variant_active_idx"
  ON "product_variant" ("product_id")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "order_active_status_idx"
  ON "order" ("status", "placed_at")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "customer_active_idx"
  ON "customer" ("created_at")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "category_active_idx"
  ON "category" ("parent_id")
  WHERE "deleted_at" IS NULL;

CREATE INDEX "collection_active_idx"
  ON "collection" ("position")
  WHERE "deleted_at" IS NULL;
