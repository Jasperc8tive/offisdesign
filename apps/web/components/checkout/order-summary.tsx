'use client';

import { Cluster, Divider, Heading, PriceTag, Stack, Text } from '@offisdesign/ui';
import { useVariantIndex } from '../../lib/hooks';
import type { CartView } from '../../lib/api/schemas';

interface Props {
  cart: CartView;
  shippingAmount?: number;
  taxAmount?: number;
  total?: number;
}

/**
 * Summary shown on every checkout step. Pulls live numbers from the cart view;
 * the `review` step overrides `shippingAmount`, `taxAmount`, and `total` with
 * the server-computed quote. Line names are resolved client-side via the
 * variant index (cart lines only carry a variantId). Stickiness is owned by the
 * surrounding <aside>.
 */
export function OrderSummary({ cart, shippingAmount, taxAmount, total }: Props) {
  const currency = cart.cart.currency;
  const { index } = useVariantIndex({ enabled: cart.cart.items.length > 0 });
  const effectiveTotal = total ?? cart.total + (shippingAmount ?? 0) + (taxAmount ?? 0);

  return (
    <div className="bg-surface rounded-lg p-6">
      <Stack gap={4}>
        <Heading level={4}>Order summary</Heading>
        <Stack gap={3}>
          {cart.cart.items.map((line) => {
            const name = index.get(line.variantId)?.name ?? 'Item';
            return (
              <Cluster key={line.id} justify="between" align="start" gap={3} wrap={false}>
                <div className="min-w-0">
                  <Text size="sm" className="text-secondary truncate">
                    {name}
                  </Text>
                  <Text size="sm" tone="muted">
                    Qty {line.quantity}
                  </Text>
                </div>
                <PriceTag amount={line.unitAmount * line.quantity} currency={currency} size="sm" />
              </Cluster>
            );
          })}
        </Stack>
        <Divider />
        <Stack gap={1}>
          <Cluster justify="between">
            <Text size="sm" tone="muted">
              Subtotal
            </Text>
            <PriceTag amount={cart.subtotal} currency={currency} size="sm" />
          </Cluster>
          {cart.discount > 0 && (
            <Cluster justify="between">
              <Text size="sm" tone="muted">
                Discount
              </Text>
              <Text size="sm">
                − <PriceTag amount={cart.discount} currency={currency} size="sm" />
              </Text>
            </Cluster>
          )}
          <Cluster justify="between">
            <Text size="sm" tone="muted">
              Shipping
            </Text>
            {shippingAmount === undefined ? (
              <Text size="sm" tone="muted">
                TBD
              </Text>
            ) : shippingAmount === 0 ? (
              <Text size="sm" className="font-semibold">
                Free
              </Text>
            ) : (
              <PriceTag amount={shippingAmount} currency={currency} size="sm" />
            )}
          </Cluster>
          <Cluster justify="between">
            <Text size="sm" tone="muted">
              Tax
            </Text>
            {taxAmount === undefined ? (
              <Text size="sm" tone="muted">
                TBD
              </Text>
            ) : (
              <PriceTag amount={taxAmount} currency={currency} size="sm" />
            )}
          </Cluster>
        </Stack>
        <Divider />
        <Cluster justify="between" align="center">
          <Text className="text-secondary font-semibold">Total</Text>
          <PriceTag amount={effectiveTotal} currency={currency} size="lg" />
        </Cluster>
      </Stack>
    </div>
  );
}
