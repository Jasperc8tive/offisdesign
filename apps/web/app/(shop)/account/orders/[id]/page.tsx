'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Cluster,
  Divider,
  Heading,
  PriceTag,
  Stack,
  Text,
} from '@offisdesign/ui';
import { useOrder } from '../../../../../lib/hooks/checkout';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? '';
  const { data: order, isLoading, isError } = useOrder(orderId);

  if (isLoading) return <Text tone="muted">Loading order…</Text>;
  if (isError || !order) return <Alert variant="error">Could not load this order.</Alert>;

  return (
    <Stack gap={6}>
      <Cluster justify="between" align="center">
        <Stack gap={1}>
          <Heading level={2}>Order {order.number}</Heading>
          <Cluster gap={2} align="center">
            <Badge variant="muted">{order.status}</Badge>
            {order.placedAt && (
              <Text size="sm" tone="muted">
                Placed {new Date(order.placedAt).toLocaleDateString()}
              </Text>
            )}
          </Cluster>
        </Stack>
        <Link href="/account/orders">
          <Button variant="outline">Back to orders</Button>
        </Link>
      </Cluster>

      <Card>
        <CardBody>
          <Stack gap={3}>
            <Heading level={4}>Items</Heading>
            <Stack gap={2}>
              {order.items.map((it) => (
                <Cluster key={it.id} justify="between" align="center">
                  <Stack gap={0}>
                    <Text className="text-secondary font-semibold">{it.productName}</Text>
                    <Text size="sm" tone="muted">
                      SKU {it.sku} · qty {it.quantity}
                    </Text>
                  </Stack>
                  <PriceTag amount={it.totalAmount} currency={it.currency} />
                </Cluster>
              ))}
            </Stack>
          </Stack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stack gap={3}>
            <Heading level={4}>Totals</Heading>
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
        </CardBody>
      </Card>
    </Stack>
  );
}
