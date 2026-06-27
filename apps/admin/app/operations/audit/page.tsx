'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Cluster, Heading, Stack, Text } from '@offisdesign/ui';
import { DataTable, type Column } from '../../../components/listing/data-table';
import { auditService } from '../../../lib/api/services';
import { formatDateTime } from '../../../lib/format';
import type { AuditEntry } from '../../../lib/api/schemas';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['admin', 'audit', page],
    queryFn: () => auditService.list({ page, pageSize: 30 }),
  });

  const columns: Column<AuditEntry>[] = [
    {
      key: 'when',
      header: 'When',
      width: '180px',
      render: (row) => (
        <Text size="sm" tone="muted">
          {formatDateTime(row.createdAt)}
        </Text>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      width: '200px',
      render: (row) => (
        <Text size="sm" tone="muted">
          {row.actorKind ?? '—'} {row.actorId ? `· ${row.actorId.slice(0, 8)}…` : ''}
        </Text>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <Stack gap={0}>
          <Text size="sm" className="font-semibold">
            {row.action}
          </Text>
          <Text size="sm" tone="muted">
            {row.entity} {row.entityId ? `· ${row.entityId.slice(0, 8)}…` : ''}
          </Text>
        </Stack>
      ),
    },
  ];

  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Heading level={1}>Audit log</Heading>
        <Text tone="muted">{query.data?.total ?? 0} events</Text>
      </Stack>

      <DataTable
        rows={query.data?.data}
        columns={columns}
        isLoading={query.isLoading}
        isError={query.isError}
        emptyText="No audit events yet."
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
