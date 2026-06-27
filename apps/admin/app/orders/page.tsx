'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Badge, Button, Cluster, FormField, Heading, Select, Stack, Text } from '@offisdesign/ui';
import { DataTable, type Column } from '../../components/listing/data-table';
import { orderService } from '../../lib/api/services';
import { formatMoney, formatDate } from '../../lib/format';
import type { AdminOrder } from '../../lib/api/schemas';

export default function OrdersListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const query = useQuery({
    queryKey: ['admin', 'orders', { page, status }],
    queryFn: () => orderService.list({ page, pageSize: 20, ...(status ? { status } : {}) }),
  });

  const columns: Column<AdminOrder>[] = [
    {
      key: 'number',
      header: 'Order',
      render: (row) => (
        <Stack gap={0}>
          <Text size="sm" className="font-semibold">
            {row.number}
          </Text>
          <Text size="sm" tone="muted">
            {row.email}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (row) => <Badge variant="muted">{row.status}</Badge>,
    },
    {
      key: 'total',
      header: 'Total',
      width: '120px',
      render: (row) => <Text size="sm">{formatMoney(row.totalAmount, row.currency)}</Text>,
    },
    {
      key: 'placedAt',
      header: 'Placed',
      width: '140px',
      render: (row) => (
        <Text size="sm" tone="muted">
          {row.placedAt ? formatDate(row.placedAt) : '—'}
        </Text>
      ),
    },
  ];

  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Heading level={1}>Orders</Heading>
        <Text tone="muted">{query.data?.total ?? 0} total</Text>
      </Stack>

      <Cluster gap={3} align="end">
        <FormField label="Status" htmlFor="st">
          <Select id="st" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FULFILLING">Fulfilling</option>
            <option value="SHIPPED">Shipped</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </FormField>
        <Button variant="outline" onClick={() => query.refetch()}>
          Refresh
        </Button>
      </Cluster>

      <DataTable
        rows={query.data?.data}
        columns={columns}
        isLoading={query.isLoading}
        isError={query.isError}
        onRowClick={(r) => router.push(`/orders/${r.id}`)}
        emptyText="No orders yet."
      />

      {(query.data?.totalPages ?? 1) > 1 && (
        <Cluster gap={2} justify="center">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Text size="sm" tone="muted">
            Page {page} of {query.data?.totalPages}
          </Text>
          <Button
            variant="outline"
            disabled={page >= (query.data?.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </Cluster>
      )}
    </Stack>
  );
}
