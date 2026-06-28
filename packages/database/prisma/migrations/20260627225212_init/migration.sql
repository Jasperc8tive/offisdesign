-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "product_link_kind" AS ENUM ('RELATED', 'CROSS_SELL', 'UP_SELL');

-- CreateEnum
CREATE TYPE "stock_reservation_status" AS ENUM ('HELD', 'CONSUMED', 'RELEASED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "stock_adjustment_reason" AS ENUM ('PURCHASE', 'SALE', 'RETURN', 'COUNT', 'DAMAGE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "cart_status" AS ENUM ('ACTIVE', 'CHECKED_OUT', 'ABANDONED');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('PENDING', 'PAID', 'FULFILLING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "cms_status" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "cms_page_kind" AS ENUM ('STANDARD', 'LANDING');

-- CreateEnum
CREATE TYPE "webhook_delivery_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "discount_kind" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "discount_scope" AS ENUM ('CART', 'PRODUCT', 'COLLECTION');

-- CreateEnum
CREATE TYPE "verification_token_kind" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "checkout_status" AS ENUM ('PENDING', 'AWAITING_PAYMENT', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "notification_channel" AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- CreateTable
CREATE TABLE "admin_user" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "admin_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "admin_user_role" (
    "admin_user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" UUID,

    CONSTRAINT "admin_user_role_pkey" PRIMARY KEY ("admin_user_id","role_id")
);

-- CreateTable
CREATE TABLE "admin_session" (
    "id" UUID NOT NULL,
    "admin_user_id" UUID NOT NULL,
    "refresh_token_jti" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "email_verified_at" TIMESTAMPTZ(6),
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_address" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "label" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "postcode" TEXT NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "phone" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "customer_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_session" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "refresh_token_jti" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "product_status" NOT NULL DEFAULT 'DRAFT',
    "brand" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_specification" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_specification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_document" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option_value" (
    "id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_option_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT,
    "price_amount" INTEGER NOT NULL,
    "price_currency" CHAR(3) NOT NULL DEFAULT 'GBP',
    "compare_at_amount" INTEGER,
    "weight_grams" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_option" (
    "variant_id" UUID NOT NULL,
    "option_value_id" UUID NOT NULL,

    CONSTRAINT "product_variant_option_pkey" PRIMARY KEY ("variant_id","option_value_id")
);

-- CreateTable
CREATE TABLE "product_media" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "media_id" UUID NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_collection" (
    "product_id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_collection_pkey" PRIMARY KEY ("product_id","collection_id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_category" (
    "product_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "product_category_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tag" (
    "product_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "product_tag_pkey" PRIMARY KEY ("product_id","tag_id")
);

-- CreateTable
CREATE TABLE "product_link" (
    "id" UUID NOT NULL,
    "from_product_id" UUID NOT NULL,
    "to_product_id" UUID NOT NULL,
    "kind" "product_link_kind" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_item" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "on_hand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "reorder_at" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_reservation" (
    "id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "context_type" TEXT NOT NULL,
    "context_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "stock_reservation_status" NOT NULL DEFAULT 'HELD',
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "stock_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustment" (
    "id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "stock_adjustment_reason" NOT NULL,
    "reference" TEXT,
    "actor_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" UUID NOT NULL,
    "customer_id" UUID,
    "anonymous_id" UUID,
    "email" CITEXT,
    "currency" CHAR(3) NOT NULL DEFAULT 'GBP',
    "status" "cart_status" NOT NULL DEFAULT 'ACTIVE',
    "applied_coupon" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_item" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_amount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'GBP',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cart_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "customer_id" UUID,
    "email" CITEXT NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'GBP',
    "subtotal_amount" INTEGER NOT NULL,
    "shipping_amount" INTEGER NOT NULL,
    "tax_amount" INTEGER NOT NULL,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'PENDING',
    "placed_at" TIMESTAMPTZ(6),
    "shipping_address" JSONB NOT NULL,
    "billing_address" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "product_name" TEXT NOT NULL,
    "variant_name" TEXT,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_amount" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'GBP',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_event" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "actor_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_ref" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'GBP',
    "status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "provider_data" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_page" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "cms_page_kind" NOT NULL DEFAULT 'STANDARD',
    "status" "cms_status" NOT NULL DEFAULT 'DRAFT',
    "seo" JSONB,
    "published_at" TIMESTAMPTZ(6),
    "scheduled_at" TIMESTAMPTZ(6),
    "unscheduled_at" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "cms_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_block" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cms_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "navigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq" (
    "id" UUID NOT NULL,
    "category" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonial" (
    "id" UUID NOT NULL,
    "author" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "source" TEXT,
    "image_id" UUID,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_folder" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "media_folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "folder_id" UUID,
    "storage_key" TEXT NOT NULL,
    "filename" TEXT,
    "content_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "focal_x" DOUBLE PRECISION,
    "focal_y" DOUBLE PRECISION,
    "derivatives" JSONB,
    "uploaded_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_event" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_delivery" (
    "id" UUID NOT NULL,
    "webhook_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "status" "webhook_delivery_status" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_attempt_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount" (
    "id" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "kind" "discount_kind" NOT NULL,
    "value" INTEGER NOT NULL,
    "currency" CHAR(3),
    "scope" "discount_scope" NOT NULL DEFAULT 'CART',
    "target_ids" UUID[],
    "min_subtotal" INTEGER,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_usage" (
    "id" UUID NOT NULL,
    "discount_id" UUID NOT NULL,
    "context_type" TEXT NOT NULL,
    "context_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'GBP',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "kind" "verification_token_kind" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_session" (
    "id" UUID NOT NULL,
    "cart_id" UUID NOT NULL,
    "customer_id" UUID,
    "email" CITEXT NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'GBP',
    "shipping_address" JSONB,
    "billing_address" JSONB,
    "shipping_method" JSONB,
    "subtotal_amount" INTEGER NOT NULL DEFAULT 0,
    "shipping_amount" INTEGER NOT NULL DEFAULT 0,
    "tax_amount" INTEGER NOT NULL DEFAULT 0,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "status" "checkout_status" NOT NULL DEFAULT 'PENDING',
    "payment_provider" TEXT,
    "payment_intent_ref" TEXT,
    "reservation_ids" UUID[],
    "order_id" UUID,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "checkout_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_key" (
    "key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "status_code" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "idempotency_key_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "author" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_media_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "cover_media_id" UUID,
    "author_id" UUID,
    "status" "cms_status" NOT NULL DEFAULT 'DRAFT',
    "seo" JSONB,
    "published_at" TIMESTAMPTZ(6),
    "scheduled_at" TIMESTAMPTZ(6),
    "unscheduled_at" TIMESTAMPTZ(6),
    "tags" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "blog_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_revision" (
    "id" UUID NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "diff" JSONB,
    "actor_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_revision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_activity_log" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "aggregate_type" TEXT,
    "aggregate_id" UUID,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout_pct" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "feature_flag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "system_setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "notification_template" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "channel" "notification_channel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_delivery" (
    "id" UUID NOT NULL,
    "template_key" TEXT NOT NULL,
    "channel" "notification_channel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "notification_status" NOT NULL DEFAULT 'PENDING',
    "provider_id" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscription" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "source" TEXT,
    "referrer" TEXT,
    "consented_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "newsletter_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_review" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "customer_id" UUID,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "status" "review_status" NOT NULL DEFAULT 'PENDING',
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "product_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_helpful_vote" (
    "review_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_helpful_vote_pkey" PRIMARY KEY ("review_id","customer_id")
);

-- CreateTable
CREATE TABLE "wishlist_item" (
    "customer_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_item_pkey" PRIMARY KEY ("customer_id","product_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_email_key" ON "admin_user"("email");

-- CreateIndex
CREATE INDEX "admin_user_deleted_at_idx" ON "admin_user"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "role_key_key" ON "role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "permission_key_key" ON "permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "admin_session_refresh_token_jti_key" ON "admin_session"("refresh_token_jti");

-- CreateIndex
CREATE INDEX "admin_session_admin_user_id_idx" ON "admin_session"("admin_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_email_key" ON "customer"("email");

-- CreateIndex
CREATE INDEX "customer_deleted_at_idx" ON "customer"("deleted_at");

-- CreateIndex
CREATE INDEX "customer_address_customer_id_idx" ON "customer_address"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_session_refresh_token_jti_key" ON "customer_session"("refresh_token_jti");

-- CreateIndex
CREATE INDEX "customer_session_customer_id_idx" ON "customer_session"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_slug_key" ON "product"("slug");

-- CreateIndex
CREATE INDEX "product_status_published_at_idx" ON "product"("status", "published_at");

-- CreateIndex
CREATE INDEX "product_deleted_at_idx" ON "product"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_specification_product_id_key_key" ON "product_specification"("product_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "product_document_product_id_media_id_key" ON "product_document"("product_id", "media_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_option_product_id_key_key" ON "product_option"("product_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "product_option_value_option_id_value_key" ON "product_option_value"("option_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_sku_key" ON "product_variant"("sku");

-- CreateIndex
CREATE INDEX "product_variant_product_id_idx" ON "product_variant"("product_id");

-- CreateIndex
CREATE INDEX "product_variant_deleted_at_idx" ON "product_variant"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_media_product_id_media_id_key" ON "product_media"("product_id", "media_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_slug_key" ON "collection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE INDEX "category_parent_id_idx" ON "category"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_slug_key" ON "tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_link_from_product_id_to_product_id_kind_key" ON "product_link"("from_product_id", "to_product_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_code_key" ON "warehouse"("code");

-- CreateIndex
CREATE INDEX "inventory_item_warehouse_id_idx" ON "inventory_item"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_item_variant_id_warehouse_id_key" ON "inventory_item"("variant_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "stock_reservation_context_type_context_id_idx" ON "stock_reservation"("context_type", "context_id");

-- CreateIndex
CREATE INDEX "stock_reservation_status_expires_at_idx" ON "stock_reservation"("status", "expires_at");

-- CreateIndex
CREATE INDEX "stock_adjustment_inventory_item_id_created_at_idx" ON "stock_adjustment"("inventory_item_id", "created_at");

-- CreateIndex
CREATE INDEX "cart_customer_id_idx" ON "cart"("customer_id");

-- CreateIndex
CREATE INDEX "cart_anonymous_id_idx" ON "cart"("anonymous_id");

-- CreateIndex
CREATE INDEX "cart_status_idx" ON "cart"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cart_item_cart_id_variant_id_key" ON "cart_item"("cart_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_number_key" ON "order"("number");

-- CreateIndex
CREATE INDEX "order_customer_id_idx" ON "order"("customer_id");

-- CreateIndex
CREATE INDEX "order_status_placed_at_idx" ON "order"("status", "placed_at");

-- CreateIndex
CREATE INDEX "order_item_order_id_idx" ON "order_item"("order_id");

-- CreateIndex
CREATE INDEX "order_event_order_id_created_at_idx" ON "order_event"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_order_id_idx" ON "payment"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_provider_ref_key" ON "payment"("provider", "provider_ref");

-- CreateIndex
CREATE UNIQUE INDEX "cms_page_slug_key" ON "cms_page"("slug");

-- CreateIndex
CREATE INDEX "cms_page_status_scheduled_at_idx" ON "cms_page"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "cms_page_status_unscheduled_at_idx" ON "cms_page"("status", "unscheduled_at");

-- CreateIndex
CREATE INDEX "cms_block_page_id_position_idx" ON "cms_block"("page_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_key_key" ON "navigation"("key");

-- CreateIndex
CREATE UNIQUE INDEX "media_folder_path_key" ON "media_folder"("path");

-- CreateIndex
CREATE INDEX "media_folder_parent_id_idx" ON "media_folder"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_storage_key_key" ON "media"("storage_key");

-- CreateIndex
CREATE INDEX "media_folder_id_idx" ON "media"("folder_id");

-- CreateIndex
CREATE INDEX "media_deleted_at_idx" ON "media"("deleted_at");

-- CreateIndex
CREATE INDEX "domain_event_aggregate_type_aggregate_id_idx" ON "domain_event"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "domain_event_type_occurred_at_idx" ON "domain_event"("type", "occurred_at");

-- CreateIndex
CREATE INDEX "webhook_delivery_webhook_id_status_idx" ON "webhook_delivery"("webhook_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "discount_code_key" ON "discount"("code");

-- CreateIndex
CREATE INDEX "discount_code_idx" ON "discount"("code");

-- CreateIndex
CREATE INDEX "discount_is_active_starts_at_ends_at_idx" ON "discount"("is_active", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "discount_usage_discount_id_created_at_idx" ON "discount_usage"("discount_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_hash_key" ON "verification_token"("token_hash");

-- CreateIndex
CREATE INDEX "verification_token_customer_id_kind_idx" ON "verification_token"("customer_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_session_cart_id_key" ON "checkout_session"("cart_id");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_session_order_id_key" ON "checkout_session"("order_id");

-- CreateIndex
CREATE INDEX "checkout_session_customer_id_idx" ON "checkout_session"("customer_id");

-- CreateIndex
CREATE INDEX "checkout_session_status_expires_at_idx" ON "checkout_session"("status", "expires_at");

-- CreateIndex
CREATE INDEX "idempotency_key_expires_at_idx" ON "idempotency_key"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "author_slug_key" ON "author"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_slug_key" ON "blog_post"("slug");

-- CreateIndex
CREATE INDEX "blog_post_status_published_at_idx" ON "blog_post"("status", "published_at");

-- CreateIndex
CREATE INDEX "blog_post_status_scheduled_at_idx" ON "blog_post"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "blog_post_author_id_idx" ON "blog_post"("author_id");

-- CreateIndex
CREATE INDEX "content_revision_aggregate_type_aggregate_id_idx" ON "content_revision"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_revision_aggregate_type_aggregate_id_version_key" ON "content_revision"("aggregate_type", "aggregate_id", "version");

-- CreateIndex
CREATE INDEX "admin_activity_log_actor_id_created_at_idx" ON "admin_activity_log"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_activity_log_aggregate_type_aggregate_id_idx" ON "admin_activity_log"("aggregate_type", "aggregate_id");

-- CreateIndex
CREATE INDEX "admin_activity_log_created_at_idx" ON "admin_activity_log"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flag_key_key" ON "feature_flag"("key");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_key_key" ON "notification_template"("key");

-- CreateIndex
CREATE INDEX "notification_delivery_status_created_at_idx" ON "notification_delivery"("status", "created_at");

-- CreateIndex
CREATE INDEX "notification_delivery_template_key_idx" ON "notification_delivery"("template_key");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscription_email_key" ON "newsletter_subscription"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscription_unsubscribed_at_idx" ON "newsletter_subscription"("unsubscribed_at");

-- CreateIndex
CREATE INDEX "product_review_product_id_status_created_at_idx" ON "product_review"("product_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "product_review_customer_id_idx" ON "product_review"("customer_id");

-- CreateIndex
CREATE INDEX "wishlist_item_customer_id_added_at_idx" ON "wishlist_item"("customer_id", "added_at");

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_role" ADD CONSTRAINT "admin_user_role_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_role" ADD CONSTRAINT "admin_user_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_session" ADD CONSTRAINT "admin_session_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_address" ADD CONSTRAINT "customer_address_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_session" ADD CONSTRAINT "customer_session_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_specification" ADD CONSTRAINT "product_specification_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_document" ADD CONSTRAINT "product_document_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option" ADD CONSTRAINT "product_option_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option_value" ADD CONSTRAINT "product_option_value_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "product_option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option" ADD CONSTRAINT "product_variant_option_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option" ADD CONSTRAINT "product_variant_option_option_value_id_fkey" FOREIGN KEY ("option_value_id") REFERENCES "product_option_value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collection" ADD CONSTRAINT "product_collection_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_collection" ADD CONSTRAINT "product_collection_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag" ADD CONSTRAINT "product_tag_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tag" ADD CONSTRAINT "product_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_link" ADD CONSTRAINT "product_link_from_product_id_fkey" FOREIGN KEY ("from_product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_link" ADD CONSTRAINT "product_link_to_product_id_fkey" FOREIGN KEY ("to_product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_item" ADD CONSTRAINT "inventory_item_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservation" ADD CONSTRAINT "stock_reservation_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustment" ADD CONSTRAINT "stock_adjustment_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_event" ADD CONSTRAINT "order_event_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_block" ADD CONSTRAINT "cms_block_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "cms_page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_folder" ADD CONSTRAINT "media_folder_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "media_folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "media_folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_delivery" ADD CONSTRAINT "webhook_delivery_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_usage" ADD CONSTRAINT "discount_usage_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "author"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful_vote" ADD CONSTRAINT "review_helpful_vote_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "product_review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
