'use client';

import { Card, CardBody, Cluster, Divider, Heading, PriceTag, Stack, Text } from '@offisdesign/ui';
import type { CartView } from '../../lib/api/schemas';

interface Props {
  cart: CartView;
  shippingAmount?: number;
  taxAmount?: number;
  total?: number;
}

/**
 * Sticky summary used on every checkout step. Pulls live numbers from the
 * cart view; checkout `review` step overrides `shippingAmount`, `taxAmount`,
 * and `total` with the server-computed quote.
 */
export function OrderSummary({ cart, shippingAmount, taxAmount, total }: Props) {
  const currency = cart.cart.currency;
  const effectiveTotal = total ?? cart.total + (shippingAmount ?? 0) + (taxAmount ?? 0);
  return (
    <Card className="sticky top-24">
      <CardBody>
        <Stack gap={4}>
          <Heading level={4}>Order summary</Heading>
          <Stack gap={2}>
            {cart.cart.items.map((line) => (
              <Cluster key={line.id} justify="between">
                <Text size="sm">
                  Variant {line.variantId.slice(0, 6)}… × {line.quantity}
                </Text>
                <PriceTag amount={line.unitAmount * line.quantity} currency={currency} size="sm" />
              </Cluster>
            ))}
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
      </CardBody>
    </Card>
  );
}
