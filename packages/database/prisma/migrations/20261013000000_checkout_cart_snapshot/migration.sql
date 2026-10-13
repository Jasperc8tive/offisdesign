-- Freeze the priced cart lines on the checkout session at review time.
--
-- Orders are built from this snapshot rather than the live cart, so a cart
-- edited after payment can no longer change what the order contains. The
-- column is nullable: it is cleared whenever the address or shipping method
-- changes, which forces a fresh review before a payment intent is created.

ALTER TABLE "checkout_session" ADD COLUMN "cart_snapshot" JSONB;
