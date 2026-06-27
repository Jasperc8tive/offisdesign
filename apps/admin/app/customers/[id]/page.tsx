'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Badge, Card, CardBody, Cluster, Heading, Stack, Text } from '@offisdesign/ui';
import { customerService } from '../../../lib/api/services';
import { formatDateTime } from '../../../lib/format';

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const customer = useQuery({
    queryKey: ['admin', 'customers', id],
    queryFn: () => customerService.get(id),
  });

  if (customer.isLoading) return <Text tone="muted">Loading…</Text>;
  if (customer.isError || !customer.data)
    return <Alert variant="error">Could not load customer.</Alert>;

  const c = customer.data;
  return (
    <Stack gap={6}>
      <Cluster justify="between" align="center">
        <Stack gap={1}>
          <Heading level={1}>
            {[c.firstName, c.lastName].filter(Boolean).join(' ') || c.email}
          </Heading>
          <Cluster gap={2} align="center">
            <Text size="sm" tone="muted">
              {c.email}
            </Text>
            <Badge variant={c.emailVerifiedAt ? 'muted' : 'outline'}>
              {c.emailVerifiedAt ? 'Verified' : 'Unverified'}
            </Badge>
          </Cluster>
        </Stack>
      </Cluster>

      <Card>
        <CardBody>
          <Stack gap={3}>
            <Heading level={4}>Account</Heading>
            <Cluster justify="between">
              <Text size="sm" tone="muted">
                Joined
              </Text>
              <Text size="sm">{formatDateTime(c.createdAt)}</Text>
            </Cluster>
            {c.emailVerifiedAt && (
              <Cluster justify="between">
                <Text size="sm" tone="muted">
                  Verified
                </Text>
                <Text size="sm">{formatDateTime(c.emailVerifiedAt)}</Text>
              </Cluster>
            )}
          </Stack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Stack gap={2}>
            <Heading level={4}>Addresses · Sessions · Wishlist · Reviews</Heading>
            <Text tone="muted" size="sm">
              These tabs are wired against the storefront customer APIs in Stage 14. The Stage 13
              cut surfaces account profile + verification state only.
            </Text>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
}
