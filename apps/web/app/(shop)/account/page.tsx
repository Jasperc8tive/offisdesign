'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
  Badge,
  Card,
  CardBody,
  Cluster,
  Heading,
  Stack,
  Text,
} from '@offisdesign/ui';
import { useAuth } from '../../../lib/providers';
import { useAddresses, useOrders, useSessions } from '../../../lib/hooks';
import { formatMoney } from '../../../lib/ux/money';

export default function AccountDashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const orders = useOrders({ pageSize: 3 });
  const addresses = useAddresses();
  const sessions = useSessions();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/account/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) return null;

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'OD';
  const verified = !!user.emailVerifiedAt;

  return (
    <Stack gap={6}>
      <Cluster gap={4} align="center">
        <Avatar initials={initials} size="xl" alt="Account avatar" />
        <Stack gap={1}>
          <Heading level={2}>Welcome back{user.firstName ? `, ${user.firstName}` : ''}</Heading>
          <Cluster gap={2} align="center">
            <Text tone="muted">{user.email}</Text>
            <Badge variant={verified ? 'muted' : 'primary'}>
              {verified ? 'Verified' : 'Email unverified'}
            </Badge>
          </Cluster>
        </Stack>
      </Cluster>

      {!verified && (
        <Alert variant="warning" title="Verify your email">
          We sent a verification link to {user.email}. Verifying unlocks order history and faster
          checkout.
        </Alert>
      )}

      <DashboardGrid>
        <SectionCard
          title="Recent orders"
          href="/account/orders"
          cta="View all orders"
          empty={!orders.isLoading && (!orders.data || orders.data.data.length === 0)}
          emptyText="No orders yet."
        >
          <Stack gap={2}>
            {orders.data?.data.slice(0, 3).map((o) => (
              <Link key={o.id} href={`/account/orders/${o.id}`} className="block">
                <Cluster justify="between" align="center">
                  <Stack gap={0}>
                    <Text className="text-secondary font-semibold">{o.number}</Text>
                    <Text size="sm" tone="muted">
                      {o.placedAt ? new Date(o.placedAt).toLocaleDateString() : ''}
                    </Text>
                  </Stack>
                  <Text>{formatMoney(o.totalAmount, o.currency)}</Text>
                </Cluster>
              </Link>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard
          title="Address book"
          href="/account/addresses"
          cta="Manage addresses"
          empty={!addresses.isLoading && (!addresses.data || addresses.data.length === 0)}
          emptyText="No addresses saved."
        >
          <Stack gap={2}>
            {addresses.data?.slice(0, 2).map((a) => (
              <Stack key={a.id} gap={0}>
                <Text className="text-secondary font-semibold">
                  {a.firstName} {a.lastName}
                </Text>
                <Text size="sm" tone="muted">
                  {a.line1}, {a.city}, {a.postcode}
                </Text>
              </Stack>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard
          title="Profile"
          href="/account/profile"
          cta="Edit profile"
          empty={false}
          emptyText=""
        >
          <Stack gap={1}>
            <Text size="sm">
              {user.firstName} {user.lastName}
            </Text>
            <Text size="sm" tone="muted">
              {user.phone ?? 'No phone number on file'}
            </Text>
          </Stack>
        </SectionCard>

        <SectionCard
          title="Security"
          href="/account/sessions"
          cta="Manage sessions"
          empty={false}
          emptyText=""
        >
          <Stack gap={1}>
            <Text size="sm">
              {sessions.data?.length ?? 0} active session
              {(sessions.data?.length ?? 0) === 1 ? '' : 's'}
            </Text>
            <Link
              href="/account/password"
              className="font-body text-body-sm text-primary underline-offset-4 hover:underline"
            >
              Change password
            </Link>
          </Stack>
        </SectionCard>
      </DashboardGrid>
    </Stack>
  );
}

function DashboardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function SectionCard({
  title,
  href,
  cta,
  empty,
  emptyText,
  children,
}: {
  title: string;
  href: string;
  cta: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardBody>
        <Stack gap={3}>
          <Cluster justify="between" align="center">
            <Heading level={4}>{title}</Heading>
            <Link
              href={href}
              className="font-body text-body-sm text-primary underline-offset-4 hover:underline"
            >
              {cta}
            </Link>
          </Cluster>
          {empty ? <Text tone="muted">{emptyText}</Text> : children}
        </Stack>
      </CardBody>
    </Card>
  );
}
