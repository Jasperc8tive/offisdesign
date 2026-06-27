'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
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
import { opsService } from '../../../lib/api/services';
import { toast } from '../../../lib/providers';
import { ApiError } from '../../../lib/api/errors';

export default function QueuesPage() {
  const queues = useQuery({
    queryKey: ['admin', 'ops', 'queues'],
    queryFn: () => opsService.queueHealth(),
    refetchInterval: 5_000,
  });

  const flush = useMutation({
    mutationFn: (scope: string) => opsService.cacheFlush(scope),
    onSuccess: (_d, scope) => toast.success(`Flushed ${scope}`),
    onError: (err) => toast.error(ApiError.is(err) ? err.message : (err as Error).message),
  });

  return (
    <Stack gap={4}>
      <Cluster justify="between" align="center">
        <Stack gap={1}>
          <Heading level={1}>Queues & cache</Heading>
          <Text tone="muted">Polls every 5 seconds.</Text>
        </Stack>
        <Can any={['system:cache']}>
          <Cluster gap={2}>
            <Button
              variant="outline"
              onClick={() => flush.mutate('catalog')}
              loading={flush.isPending}
            >
              Flush catalog cache
            </Button>
            <Button variant="outline" onClick={() => flush.mutate('cms')} loading={flush.isPending}>
              Flush CMS cache
            </Button>
          </Cluster>
        </Can>
      </Cluster>

      {queues.isLoading ? (
        <Text tone="muted">Loading queues…</Text>
      ) : queues.isError ? (
        <Alert variant="error">Could not fetch queue health.</Alert>
      ) : (
        <Stack gap={3}>
          {queues.data?.queues.map((q) => (
            <Card key={q.name}>
              <CardBody>
                <Cluster justify="between" align="center">
                  <Heading level={4}>{q.name}</Heading>
                  <Cluster gap={3} align="center">
                    <Metric label="Waiting" value={q.waiting} />
                    <Metric label="Active" value={q.active} />
                    <Metric label="Failed" value={q.failed} alert={q.failed > 0} />
                    {q.completed !== undefined && <Metric label="Completed" value={q.completed} />}
                  </Cluster>
                </Cluster>
              </CardBody>
            </Card>
          ))}
          {queues.data?.queues.length === 0 && <Text tone="muted">No queues registered.</Text>}
        </Stack>
      )}
    </Stack>
  );
}

function Metric({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <Stack gap={0} align="end">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Badge variant={alert ? 'outline' : 'muted'}>{value}</Badge>
    </Stack>
  );
}
