'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Card, CardBody, Cluster, Heading, Stack, Switch, Text } from '@offisdesign/ui';
import { Can } from '../../../components/rbac';
import { opsService } from '../../../lib/api/services';
import { toast } from '../../../lib/providers';
import { ApiError } from '../../../lib/api/errors';

export default function FeatureFlagsPage() {
  const qc = useQueryClient();
  const flags = useQuery({
    queryKey: ['admin', 'flags'],
    queryFn: () => opsService.listFlags(),
  });

  const setFlag = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      opsService.setFlag(key, { enabled }),
    onMutate: async ({ key, enabled }) => {
      // Optimistic toggle so the switch feels instant; rollback on error.
      await qc.cancelQueries({ queryKey: ['admin', 'flags'] });
      const previous = qc.getQueryData<typeof flags.data>(['admin', 'flags']);
      if (previous) {
        qc.setQueryData(
          ['admin', 'flags'],
          previous.map((f) => (f.key === key ? { ...f, enabled } : f)),
        );
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['admin', 'flags'], ctx.previous);
      toast.error(ApiError.is(err) ? err.message : (err as Error).message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin', 'flags'] }),
  });

  if (flags.isLoading) return <Text tone="muted">Loading flags…</Text>;
  if (flags.isError) return <Alert variant="error">Could not load feature flags.</Alert>;

  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Heading level={1}>Feature flags</Heading>
        <Text tone="muted">Toggle features without a redeploy. Changes propagate via Redis.</Text>
      </Stack>

      <Stack gap={3}>
        {flags.data?.map((f) => (
          <Card key={f.id}>
            <CardBody>
              <Cluster justify="between" align="center">
                <Stack gap={1}>
                  <Text className="font-semibold">{f.key}</Text>
                  {f.description && (
                    <Text size="sm" tone="muted">
                      {f.description}
                    </Text>
                  )}
                </Stack>
                <Can
                  any={['system:flags']}
                  fallback={
                    <Text size="sm" tone="muted">
                      {f.enabled ? 'On' : 'Off'}
                    </Text>
                  }
                >
                  <Switch
                    checked={f.enabled}
                    onCheckedChange={(checked) => setFlag.mutate({ key: f.key, enabled: checked })}
                  />
                </Can>
              </Cluster>
            </CardBody>
          </Card>
        ))}
        {flags.data?.length === 0 && <Text tone="muted">No flags defined.</Text>}
      </Stack>
    </Stack>
  );
}
