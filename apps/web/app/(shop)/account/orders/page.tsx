'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CardBody,
  Cluster,
  EmptyState,
  Heading,
  Stack,
  Text,
} from '@offisdesign/ui';
import { useOrders } from '../../../../lib/hooks';
import { formatMoney } from '../../../../lib/ux/money';

export default function OrderHistoryPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders({ page, pageSize: 20 });

  if (isLoading) return <Text tone="muted">Loading orders…</Text>;
  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        description="When you place an order it will appear here."
        action={
          <Link href="/search">
            <Button>Browse office furniture</Button>
          </Link>
        }
      />
    );
  }

  return (
    <Stack gap={4}>
      <Heading level={2}>Orders</Heading>
      <Stack gap={3}>
        {data.data.map((o) => (
          <Link key={o.id} href={`/account/orders/${o.id}`}>
            <Card className="transition-shadow hover:shadow-sm">
              <CardBody>
                <Cluster justify="between" align="center">
                  <Stack gap={1}>
                    <Cluster gap={2} align="center">
                      <Text className="text-secondary font-semibold">{o.number}</Text>
                      <Badge variant="muted">{o.status}</Badge>
                    </Cluster>
                    {o.placedAt && (
                      <Text size="sm" tone="muted">
                        Placed {new Date(o.placedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </Stack>
                  <Text className="text-secondary font-semibold">
                    {formatMoney(o.totalAmount, o.currency)}
                  </Text>
                </Cluster>
              </CardBody>
            </Card>
          </Link>
        ))}
      </Stack>
      {data.totalPages > 1 && (
        <Cluster gap={2} justify="center">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Text size="sm" tone="muted">
            Page {page} of {data.totalPages}
          </Text>
          <Button
            variant="outline"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </Cluster>
      )}
    </Stack>
  );
}
