'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Cluster, FormField, Heading, Select, Stack, Text } from '@offisdesign/ui';
import { DataTable, type Column } from '../../../components/listing/data-table';
import { Can } from '../../../components/rbac';
import { cmsService } from '../../../lib/api/services';
import { toast } from '../../../lib/providers';
import type { CmsPage } from '../../../lib/api/schemas';
import { ApiError } from '../../../lib/api/errors';

export default function CmsPagesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const query = useQuery({
    queryKey: ['admin', 'cms', 'pages', { page, status }],
    queryFn: () => cmsService.listPages({ page, pageSize: 20, ...(status ? { status } : {}) }),
  });

  const publish = useMutation({
    mutationFn: (id: string) => cmsService.publishPage(id),
    onSuccess: () => {
      toast.success('Page published');
      qc.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] });
    },
    onError: (err) => toast.error(ApiError.is(err) ? err.message : (err as Error).message),
  });
  const archive = useMutation({
    mutationFn: (id: string) => cmsService.archivePage(id),
    onSuccess: () => {
      toast.success('Page archived');
      qc.invalidateQueries({ queryKey: ['admin', 'cms', 'pages'] });
    },
  });

  const columns: Column<CmsPage>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <Stack gap={0}>
          <Text size="sm" className="font-semibold">
            {row.title}
          </Text>
          <Text size="sm" tone="muted">
            /{row.slug}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'kind',
      header: 'Kind',
      width: '120px',
      render: (row) => <Badge variant="muted">{row.kind}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (row) => <Badge variant="muted">{row.status}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '200px',
      render: (row) => (
        <Cluster gap={2}>
          <Can any={['cms:publish']}>
            {row.status !== 'PUBLISHED' && (
              <Button size="sm" variant="outline" onClick={() => publish.mutate(row.id)}>
                Publish
              </Button>
            )}
            {row.status === 'PUBLISHED' && (
              <Button size="sm" variant="ghost" onClick={() => archive.mutate(row.id)}>
                Archive
              </Button>
            )}
          </Can>
        </Cluster>
      ),
    },
  ];

  return (
    <Stack gap={4}>
      <Cluster justify="between" align="center">
        <Stack gap={1}>
          <Heading level={1}>CMS pages</Heading>
          <Text tone="muted">{query.data?.total ?? 0} total</Text>
        </Stack>
      </Cluster>

      <Cluster gap={3} align="end">
        <FormField label="Status" htmlFor="st">
          <Select id="st" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ARCHIVED">Archived</option>
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
        emptyText="No pages yet."
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
