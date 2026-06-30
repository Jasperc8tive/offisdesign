'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { Alert, Button, Cluster, Divider, Heading, PriceTag, Stack, Text } from '@offisdesign/ui';
import { useOrder } from '../../../../../lib/hooks/checkout';
import { useAnalytics, useCart } from '../../../../../lib/providers';

export default function ConfirmationPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? '';
  const { data: order, isLoading, isError } = useOrder(orderId);
  const { track } = useAnalytics();
  const { clear } = useCart();

  useEffect(() => {
    if (order) {
      track('purchase_confirmed', { orderId: order.id });
      void clear();
    }
  }, [order?.id]);

  if (isLoading) return <Text tone="muted">Loading your order…</Text>;
  if (isError || !order) return <Alert variant="error">Could not load this order.</Alert>;

  return (
    <div className="mx-auto max-w-xl">
      <Stack gap={8}>
        <Stack gap={3} align="center" className="text-center">
          <span className="bg-primary-subtle text-primary inline-flex h-14 w-14 items-center justify-center rounded-full">
            <Check width={28} height={28} aria-hidden />
          </span>
          <Stack gap={2} align="center">
            <Heading level={1}>Thank you for your order</Heading>
            <Text tone="muted" className="max-w-prose">
              Order <strong>{order.number}</strong> is confirmed. We&apos;ll email you a receipt and
              let you know the moment it ships.
            </Text>
          </Stack>
        </Stack>

        <div className="bg-surface rounded-lg p-6">
          <Stack gap={4}>
            <Heading level={4}>Summary</Heading>
            <Stack gap={3}>
              {order.items.map((it) => (
                <Cluster key={it.id} justify="between" align="start" gap={3} wrap={false}>
                  <div className="min-w-0">
                    <Text size="sm" className="text-secondary truncate">
                      {it.productName}
                    </Text>
                    <Text size="sm" tone="muted">
                      Qty {it.quantity}
                    </Text>
                  </div>
                  <PriceTag amount={it.totalAmount} currency={it.currency} size="sm" />
                </Cluster>
              ))}
            </Stack>
            <Divider />
            <Stack gap={1}>
              <Cluster justify="between">
                <Text size="sm" tone="muted">
                  Subtotal
                </Text>
                <PriceTag amount={order.subtotalAmount} currency={order.currency} size="sm" />
              </Cluster>
              <Cluster justify="between">
                <Text size="sm" tone="muted">
                  Shipping
                </Text>
                <PriceTag amount={order.shippingAmount} currency={order.currency} size="sm" />
              </Cluster>
              <Cluster justify="between">
                <Text size="sm" tone="muted">
                  Tax
                </Text>
                <PriceTag amount={order.taxAmount} currency={order.currency} size="sm" />
              </Cluster>
              {order.discountAmount > 0 && (
                <Cluster justify="between">
                  <Text size="sm" tone="muted">
                    Discount
                  </Text>
                  <Text size="sm">
                    − <PriceTag amount={order.discountAmount} currency={order.currency} size="sm" />
                  </Text>
                </Cluster>
              )}
            </Stack>
            <Divider />
            <Cluster justify="between" align="center">
              <Text className="text-secondary font-semibold">Total</Text>
              <PriceTag amount={order.totalAmount} currency={order.currency} size="lg" />
            </Cluster>
          </Stack>
        </div>

        <Cluster gap={3} justify="center">
          <Link href="/account/orders">
            <Button variant="outline">View orders</Button>
          </Link>
          <Link href="/search">
            <Button>Continue shopping</Button>
          </Link>
        </Cluster>
      </Stack>
    </div>
  );
}
