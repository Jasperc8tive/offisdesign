'use client';

import { Alert, Button, Card, CardBody, Cluster, Heading, Stack, Text } from '@offisdesign/ui';
import { useRevokeSession, useSessions } from '../../../../lib/hooks';
import { toast } from '../../../../lib/providers';
import { ApiError } from '../../../../lib/api/errors';

export default function SessionsPage() {
  const { data, isLoading, isError } = useSessions();
  const revoke = useRevokeSession();

  if (isLoading) return <Text tone="muted">Loading sessions…</Text>;
  if (isError) return <Alert variant="error">Could not load sessions.</Alert>;

  return (
    <Stack gap={4}>
      <Heading level={2}>Active sessions</Heading>
      <Text tone="muted">
        These are the devices currently signed in to your account. Revoke any session you don&apos;t
        recognise.
      </Text>
      {(!data || data.length === 0) && <Text tone="muted">No active sessions.</Text>}
      <Stack gap={3}>
        {data?.map((s) => (
          <Card key={s.id}>
            <CardBody>
              <Cluster justify="between" align="center">
                <Stack gap={1}>
                  <Text className="text-secondary font-semibold">
                    {s.userAgent ?? 'Unknown device'}
                  </Text>
                  <Text size="sm" tone="muted">
                    {s.ipAddress ?? 'Unknown IP'} · started {new Date(s.createdAt).toLocaleString()}
                  </Text>
                </Stack>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await revoke.mutateAsync(s.id);
                      toast.success('Session revoked');
                    } catch (err) {
                      toast.error(ApiError.is(err) ? err.message : (err as Error).message);
                    }
                  }}
                >
                  Revoke
                </Button>
              </Cluster>
            </CardBody>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
