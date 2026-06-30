'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, RotateCcw, Trash2, Truck } from 'lucide-react';
import {
  Alert,
  AspectRatio,
  Button,
  Cluster,
  Divider,
  EmptyState,
  FormField,
  Heading,
  Input,
  PriceTag,
  Quantity,
  Skeleton,
  Stack,
  Text,
} from '@offisdesign/ui';
import { useVariantIndex, type VariantRef } from '../../../lib/hooks';
import { Media } from '../../../components/media/media';
import { useCart, toast } from '../../../lib/providers';
import { ApiError } from '../../../lib/api/errors';

const TRUST = [
  { icon: Lock, label: 'Secure checkout', detail: 'Encrypted payment, Stripe-protected.' },
  { icon: Truck, label: 'Free UK delivery', detail: 'On orders over £500.' },
  { icon: RotateCcw, label: '30-day returns', detail: 'Changed your mind? Send it back.' },
];

interface LineProps {
  quantity: number;
  unitAmount: number;
  currency: string;
  product: VariantRef | undefined;
  resolving: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function CartLine({
  quantity,
  unitAmount,
  currency,
  product,
  resolving,
  onQuantity,
  onRemove,
}: LineProps) {
  const href = product ? `/products/${product.slug}` : undefined;
  return (
    <Cluster gap={4} align="start" wrap={false}>
      <div className="w-24 shrink-0 sm:w-28">
        {href ? (
          <Link
            href={href}
            className="focus-visible:ring-primary block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <AspectRatio ratio={1} className="bg-primary-subtle rounded-md">
              <Media mediaId={product?.mediaId} alt={product?.name ?? ''} sizes="112px" />
            </AspectRatio>
          </Link>
        ) : (
          <AspectRatio ratio={1} className="bg-primary-subtle rounded-md" />
        )}
      </div>
      <Stack gap={2} className="min-w-0 flex-1">
        <Cluster justify="between" align="start" wrap={false}>
          <Stack gap={1} className="min-w-0">
            {resolving && !product ? (
              <Skeleton className="h-5 w-40" />
            ) : href ? (
              <Link
                href={href}
                className="text-secondary hover:text-primary duration-base ease-standard font-semibold transition-colors focus-visible:underline focus-visible:outline-none"
              >
                {product!.name}
              </Link>
            ) : (
              <Text className="text-secondary font-semibold">Item</Text>
            )}
            <Text size="sm" tone="muted">
              <PriceTag amount={unitAmount} currency={currency} size="sm" /> each
            </Text>
          </Stack>
          <button
            type="button"
            aria-label="Remove item"
            onClick={onRemove}
            className="text-muted hover:text-primary focus-visible:ring-primary shrink-0 rounded-sm p-1 transition-colors focus-visible:outline-none focus-visible:ring-2"
          >
            <Trash2 width={16} height={16} aria-hidden />
          </button>
        </Cluster>
        <Cluster justify="between" align="center">
          <Quantity value={quantity} onChange={onQuantity} />
          <PriceTag amount={unitAmount * quantity} currency={currency} />
        </Cluster>
      </Stack>
    </Cluster>
  );
}

export default function CartPage() {
  const { cart, isLoading, itemCount, updateItem, removeItem, applyCoupon } = useCart();
  const { index, isLoading: indexLoading } = useVariantIndex({ enabled: itemCount > 0 });
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  if (isLoading) return <Text tone="muted">Loading cart…</Text>;
  if (!cart || itemCount === 0) {
    return (
      <EmptyState
        title="Your bag is empty"
        description="Add a piece to see it here."
        action={
          <Link href="/search">
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
    <Stack gap={8}>
      <Stack gap={1}>
        <Heading level={1}>Your bag</Heading>
        <Text tone="muted">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
      </Stack>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Cart items">
          <div className="border-border divide-border divide-y border-y">
            {cart.cart.items.map((line) => (
              <div key={line.id} className="py-6 first:pt-0">
                <CartLine
                  quantity={line.quantity}
                  unitAmount={line.unitAmount}
                  currency={line.currency}
                  product={index.get(line.variantId)}
                  resolving={indexLoading}
                  onQuantity={(q) => updateItem({ variantId: line.variantId, quantity: q })}
                  onRemove={async () => {
                    await removeItem(line.variantId);
                    toast.success('Removed');
                  }}
                />
              </div>
            ))}
          </div>
          <Cluster className="mt-8">
            <Link href="/search">
              <Button variant="ghost">Continue shopping</Button>
            </Link>
          </Cluster>
        </section>

        <aside aria-label="Order summary" className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-surface rounded-lg p-6">
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
              <Text size="sm" tone="muted">
                Shipping &amp; tax calculated at checkout.
              </Text>
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
                        <Cluster gap={2} align="center" wrap={false}>
                          <Input
                            id="coupon"
                            placeholder="ENTER CODE"
                            value={coupon}
                            onChange={(e) => setCoupon(e.target.value)}
                            autoComplete="off"
                          />
                          <Button type="submit" variant="outline" disabled={!coupon.trim()}>
                            Apply
                          </Button>
                        </Cluster>
                      </FormField>
                      {couponError && (
                        <Text size="sm" tone="primary">
                          {couponError}
                        </Text>
                      )}
                    </>
                  )}
                </Stack>
              </form>

              <Link href="/checkout">
                <Button
                  size="lg"
                  fullWidth
                  leadingIcon={<Lock width={16} height={16} aria-hidden />}
                >
                  Secure checkout
                </Button>
              </Link>
            </Stack>
          </div>

          <Stack gap={3} className="mt-6 px-1">
            {TRUST.map((t) => (
              <Cluster key={t.label} gap={3} align="start" wrap={false}>
                <t.icon
                  width={18}
                  height={18}
                  aria-hidden
                  className="text-primary mt-0.5 shrink-0"
                />
                <Stack gap={0}>
                  <Text size="sm" className="text-secondary font-semibold">
                    {t.label}
                  </Text>
                  <Text size="sm" tone="muted">
                    {t.detail}
                  </Text>
                </Stack>
              </Cluster>
            ))}
          </Stack>
        </aside>
      </div>
    </Stack>
  );
}
