'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Cluster,
  FormField,
  Heading,
  Input,
  Select,
  Stack,
  Text,
} from '@offisdesign/ui';
import { DataTable, type Column } from '../../../components/listing/data-table';
import { Can } from '../../../components/rbac';
import { catalogService } from '../../../lib/api/services';
import { toast } from '../../../lib/providers';
import { formatMoney } from '../../../lib/format';
import type { AdminProduct } from '../../../lib/api/schemas';
import { ApiError } from '../../../lib/api/errors';

export default function ProductsListPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const query = useQuery({
    queryKey: ['admin', 'products', { page, q, status }],
    queryFn: () =>
      catalogService.listProducts({
        page,
        pageSize: 20,
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
      }),
  });

  const publish = useMutation({
    mutationFn: (id: string) => catalogService.publishProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
  const archive = useMutation({
    mutationFn: (id: string) => catalogService.archiveProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });

  async function bulkPublish() {
    const ids = [...selectedIds];
    try {
      await Promise.all(ids.map((id) => publish.mutateAsync(id)));
      toast.success(`Published ${ids.length} product${ids.length === 1 ? '' : 's'}`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(ApiError.is(err) ? err.message : (err as Error).message);
    }
  }

  async function bulkArchive() {
    const ids = [...selectedIds];
    try {
      await Promise.all(ids.map((id) => archive.mutateAsync(id)));
      toast.success(`Archived ${ids.length} product${ids.length === 1 ? '' : 's'}`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(ApiError.is(err) ? err.message : (err as Error).message);
    }
  }

  const columns: Column<AdminProduct>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <Stack gap={0}>
          <Text size="sm" className="font-semibold">
            {row.name}
          </Text>
          <Text size="sm" tone="muted">
            {row.slug}
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
      key: 'price',
      header: 'From',
      width: '120px',
      render: (row) => {
        const v = row.variants[0];
        if (!v)
          return (
            <Text size="sm" tone="muted">
              —
            </Text>
          );
        return <Text size="sm">{formatMoney(v.priceAmount, v.priceCurrency)}</Text>;
      },
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      width: '160px',
      render: (row) => (
        <Text size="sm" tone="muted">
          {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}
        </Text>
      ),
    },
  ];

  return (
    <Stack gap={4}>
      <Cluster justify="between" align="center">
        <Stack gap={1}>
          <Heading level={1}>Products</Heading>
          <Text tone="muted">
            {query.data?.total ?? 0} total · {selectedIds.size} selected
          </Text>
        </Stack>
        <Can any={['catalog:write']}>
          <Button onClick={() => router.push('/catalog/products/new')}>New product</Button>
        </Can>
      </Cluster>

      <Cluster gap={3} align="end">
        <FormField label="Search" htmlFor="q">
          <Input
            id="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or SKU…"
          />
        </FormField>
        <FormField label="Status" htmlFor="status">
          <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </FormField>
        <Button variant="outline" onClick={() => query.refetch()}>
          Refresh
        </Button>
      </Cluster>

      {selectedIds.size > 0 && (
        <Cluster
          gap={2}
          className="bg-primary-subtle/60 border-default flex items-center rounded-md border px-3 py-2"
        >
          <Text size="sm" className="font-semibold">
            {selectedIds.size} selected
          </Text>
          <div className="ml-auto flex gap-2">
            <Can any={['catalog:write']}>
              <Button size="sm" variant="outline" onClick={bulkPublish}>
                Publish
              </Button>
              <Button size="sm" variant="outline" onClick={bulkArchive}>
                Archive
              </Button>
            </Can>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        </Cluster>
      )}

      <DataTable
        rows={query.data?.data}
        columns={columns}
        isLoading={query.isLoading}
        isError={query.isError}
        selection={{
          rowKey: (r) => r.id,
          selectedIds,
          onChange: setSelectedIds,
        }}
        onRowClick={(r) => router.push(`/catalog/products/${r.id}`)}
        emptyText="No products yet."
      />

      {(query.data?.totalPages ?? 1) > 1 && (
        <Cluster gap={2} justify="center">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
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
