'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import {
  Alert,
  AspectRatio,
  Button,
  Cluster,
  Divider,
  EmptyState,
  FormField,
  Grid,
  Heading,
  Input,
  PriceTag,
  Quantity,
  Stack,
  Text,
} from '@offisdesign/ui';
import { useCart, toast } from '../../../lib/providers';
import { ApiError } from '../../../lib/api/errors';

export default function CartPage() {
  const { cart, isLoading, itemCount, updateItem, removeItem, applyCoupon } = useCart();
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  if (isLoading) return <Text tone="muted">Loading cart…</Text>;
  if (!cart || itemCount === 0) {
    return (
      <EmptyState
        title="Your bag is empty"
        description="Add a piece to see it here."
        action={
          <Link href="/">
            <Button>Start browsing</Button>
          </Link>
        }
      />
    );
  }

  const currency = cart.cart.currency;
  const applied = cart.cart.appliedCoupon;

  async function submitCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError(null);
    try {
      await applyCoupon(coupon.trim());
      toast.success('Coupon applied');
      setCoupon('');
    } catch (err) {
      const message = ApiError.is(err) ? err.message : (err as Error).message;
      setCouponError(message);
    }
  }

  return (
    <Stack gap={6}>
      <Heading level={1}>Your bag</Heading>
      <Grid cols={3} gap={6}>
        <section className="lg:col-span-2" aria-label="Cart items">
          <Stack gap={3}>
            {cart.cart.items.map((line) => (
              <Cluster key={line.id} gap={4} align="start">
                <div className="w-24 shrink-0">
                  <AspectRatio ratio={1} className="bg-primary-subtle rounded-sm" />
                </div>
                <Stack gap={2} className="flex-1">
                  <Cluster justify="between" align="start">
                    <Stack gap={1}>
                      <Text className="text-secondary font-semibold">
                        Variant {line.variantId.slice(0, 8)}…
                      </Text>
                      <Text size="sm" tone="muted">
                        {line.currency}
                      </Text>
                    </Stack>
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={async () => {
                        await removeItem(line.variantId);
                        toast.success('Removed');
                      }}
                      className="text-muted hover:text-primary focus-visible:ring-primary transition-colors focus-visible:outline-none focus-visible:ring-2"
                    >
                      <Trash2 width={16} height={16} aria-hidden />
                    </button>
                  </Cluster>
                  <Cluster justify="between" align="center">
                    <Quantity
                      value={line.quantity}
                      onChange={(q) => updateItem({ variantId: line.variantId, quantity: q })}
                    />
                    <PriceTag amount={line.unitAmount * line.quantity} currency={line.currency} />
                  </Cluster>
                </Stack>
              </Cluster>
            ))}
          </Stack>
          <Cluster className="mt-6">
            <Link href="/">
              <Button variant="ghost">Continue shopping</Button>
            </Link>
          </Cluster>
        </section>

        <aside className="lg:col-span-1" aria-label="Order summary">
          <Stack gap={4}>
            <Heading level={3}>Order summary</Heading>
            <Cluster justify="between">
              <Text tone="muted">Subtotal</Text>
              <PriceTag amount={cart.subtotal} currency={currency} />
            </Cluster>
            {cart.discount > 0 && (
              <Cluster justify="between">
                <Text tone="muted">Discount</Text>
                <Text>
                  − <PriceTag amount={cart.discount} currency={currency} size="sm" />
                </Text>
              </Cluster>
            )}
            <Stack gap={2}>
              <Text size="sm" tone="muted">
                Shipping & tax calculated at checkout.
              </Text>
            </Stack>
            <Divider />
            <Cluster justify="between" align="center">
              <Text className="text-secondary font-semibold">Total</Text>
              <PriceTag amount={cart.total} currency={currency} size="lg" />
            </Cluster>

            <form onSubmit={submitCoupon}>
              <Stack gap={2}>
                {applied ? (
                  <Alert variant="success" title={`Coupon "${applied}" applied`}>
                    <Cluster justify="between" align="center">
                      <Text size="sm" tone="muted">
                        Save during checkout
                      </Text>
                      <button
                        type="button"
                        onClick={async () => {
                          await applyCoupon(null);
                          toast.success('Coupon removed');
                        }}
                        className="font-body text-body-sm text-primary underline-offset-4 hover:underline"
                      >
                        Remove
                      </button>
                    </Cluster>
                  </Alert>
                ) : (
                  <>
                    <FormField label="Discount code" htmlFor="coupon">
                      <Input
                        id="coupon"
                        placeholder="ENTER CODE"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        autoComplete="off"
                      />
                    </FormField>
                    {couponError && (
                      <Text size="sm" tone="primary">
                        {couponError}
                      </Text>
                    )}
                    <Button type="submit" variant="outline" disabled={!coupon.trim()}>
                      Apply
                    </Button>
                  </>
                )}
              </Stack>
            </form>

            <Link href="/checkout">
              <Button size="lg" fullWidth>
                Checkout
              </Button>
            </Link>
          </Stack>
        </aside>
      </Grid>
    </Stack>
  );
}
