'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Badge, Button, Cluster, FormField, Heading, Input, Stack, Text } from '@offisdesign/ui';
import { DataTable, type Column } from '../../components/listing/data-table';
import { customerService } from '../../lib/api/services';
import { formatDate } from '../../lib/format';
import type { AdminCustomer } from '../../lib/api/schemas';

export default function CustomersListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');

  const query = useQuery({
    queryKey: ['admin', 'customers', { page, q }],
    queryFn: () => customerService.list({ page, pageSize: 20, ...(q ? { q } : {}) }),
  });

  const columns: Column<AdminCustomer>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (row) => (
        <Stack gap={0}>
          <Text size="sm" className="font-semibold">
            {[row.firstName, row.lastName].filter(Boolean).join(' ') || row.email}
          </Text>
          <Text size="sm" tone="muted">
            {row.email}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'verified',
      header: 'Verified',
      width: '120px',
      render: (row) => (
        <Badge variant={row.emailVerifiedAt ? 'muted' : 'outline'}>
          {row.emailVerifiedAt ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      width: '140px',
      render: (row) => (
        <Text size="sm" tone="muted">
          {formatDate(row.createdAt)}
        </Text>
      ),
    },
  ];

  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Heading level={1}>Customers</Heading>
        <Text tone="muted">{query.data?.total ?? 0} total</Text>
      </Stack>

      <Cluster gap={3} align="end">
        <FormField label="Search" htmlFor="q">
          <Input
            id="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Email or name…"
          />
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
        onRowClick={(r) => router.push(`/customers/${r.id}`)}
        emptyText="No customers yet."
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
