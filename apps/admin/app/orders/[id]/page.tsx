'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Cluster,
  Heading,
  Stack,
  Text,
} from '@offisdesign/ui';
import { Can } from '../../../components/rbac';
import { orderService } from '../../../lib/api/services';
import { formatDateTime, formatMoney } from '../../../lib/format';
import { toast } from '../../../lib/providers';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = useQuery({
    queryKey: ['admin', 'orders', id],
    queryFn: () => orderService.get(id),
  });

  if (order.isLoading) return <Text tone="muted">Loading…</Text>;
  if (order.isError || !order.data) return <Alert variant="error">Could not load order.</Alert>;

  return (
    <Stack gap={6}>
      <Cluster justify="between" align="center">
        <Stack gap={1}>
          <Heading level={1}>Order {order.data.number}</Heading>
          <Cluster gap={2} align="center">
            <Badge variant="muted">{order.data.status}</Badge>
            <Text size="sm" tone="muted">
              Placed {order.data.placedAt ? formatDateTime(order.data.placedAt) : '—'}
            </Text>
          </Cluster>
        </Stack>
        <Can any={['orders:write']}>
          <Cluster gap={2}>
            <Button variant="outline" onClick={() => toast.info('Refund flow lands in Stage 14.')}>
              Refund
            </Button>
            <Button variant="ghost" onClick={() => toast.info('Resend email — wired in Stage 14.')}>
              Resend confirmation
            </Button>
          </Cluster>
        </Can>
      </Cluster>

      <Card>
        <CardBody>
          <Stack gap={3}>
            <Heading level={4}>Customer</Heading>
            <Text size="sm">{order.data.email}</Text>
          </Stack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stack gap={3}>
            <Heading level={4}>Totals</Heading>
            <Cluster justify="between">
              <Text size="sm" tone="muted">
                Subtotal
              </Text>
              <Text size="sm">{formatMoney(order.data.subtotalAmount, order.data.currency)}</Text>
            </Cluster>
            <Cluster justify="between" align="center">
              <Text className="font-semibold">Total</Text>
              <Text className="font-semibold">
                {formatMoney(order.data.totalAmount, order.data.currency)}
              </Text>
            </Cluster>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}
