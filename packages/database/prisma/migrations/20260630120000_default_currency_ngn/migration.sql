-- OFFISDESIGN is a Lagos, Nigeria brand: switch the DEFAULT currency for every
-- money column from GBP to NGN so new records are priced in Naira.
--
-- This changes the column DEFAULT only. Existing rows are intentionally left
-- unchanged — their amounts were entered in their original currency, so
-- relabelling them as NGN without re-pricing would be wrong. Existing catalogue
-- prices are re-denominated via the Admin app as an operational task.

ALTER TABLE "product_variant" ALTER COLUMN "price_currency" SET DEFAULT 'NGN';
ALTER TABLE "cart" ALTER COLUMN "currency" SET DEFAULT 'NGN';
ALTER TABLE "cart_item" ALTER COLUMN "currency" SET DEFAULT 'NGN';
ALTER TABLE "order" ALTER COLUMN "currency" SET DEFAULT 'NGN';
ALTER TABLE "order_item" ALTER COLUMN "currency" SET DEFAULT 'NGN';
ALTER TABLE "payment" ALTER COLUMN "currency" SET DEFAULT 'NGN';
ALTER TABLE "discount_usage" ALTER COLUMN "currency" SET DEFAULT 'NGN';
ALTER TABLE "checkout_session" ALTER COLUMN "currency" SET DEFAULT 'NGN';
