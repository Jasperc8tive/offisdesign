'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
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
import { StatCard } from '../components/dashboard/stat-card';
import {
  catalogService,
  customerService,
  inventoryService,
  opsService,
  orderService,
} from '../lib/api/services';
import { formatMoney, formatNumber } from '../lib/format';
import { Can } from '../components/rbac';
import { useAuth } from '../lib/providers';

export default function DashboardPage() {
  const { can } = useAuth();

  // Each widget guards on its own permission scope. The query is disabled
  // entirely when the user can't read the underlying entity, so unauthorised
  // calls never even leave the browser.
  const orders = useQuery({
    queryKey: ['admin', 'orders', 'recent'],
    queryFn: () => orderService.list({ pageSize: 50 }),
    enabled: can('orders:read'),
  });
  const customers = useQuery({
    queryKey: ['admin', 'customers', 'count'],
    queryFn: () => customerService.list({ pageSize: 1 }),
    enabled: can('customers:read'),
  });
  const products = useQuery({
    queryKey: ['admin', 'products', 'count'],
    queryFn: () => catalogService.listProducts({ pageSize: 1 }),
    enabled: can('catalog:read'),
  });
  const lowStock = useQuery({
    queryKey: ['admin', 'inventory', 'low'],
    queryFn: () => inventoryService.lowStock({ threshold: 5, pageSize: 5 }),
    enabled: can('inventory:read'),
  });
  const queues = useQuery({
    queryKey: ['admin', 'ops', 'queues'],
    queryFn: () => opsService.queueHealth(),
    enabled: can('system:audit'),
    refetchInterval: 15_000,
  });

  const revenue =
    orders.data?.data
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0) ?? 0;
  const currency = orders.data?.data[0]?.currency ?? 'GBP';
  const failedJobs = queues.data?.queues.reduce((sum, q) => sum + q.failed, 0) ?? 0;
  const activeJobs = queues.data?.queues.reduce((sum, q) => sum + q.active, 0) ?? 0;

  return (
    <Stack gap={6}>
      <Stack gap={1}>
        <Heading level={1}>Dashboard</Heading>
        <Text tone="muted">Operational snapshot. Numbers refresh every minute.</Text>
      </Stack>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Can any={['orders:read']}>
          <StatCard
            title="Revenue (recent)"
            value={formatMoney(revenue, currency)}
            hint={`${orders.data?.total ?? 0} orders in window`}
            loading={orders.isLoading}
          />
        </Can>
        <Can any={['orders:read']}>
          <StatCard
            title="Orders"
            value={formatNumber(orders.data?.total ?? 0)}
            loading={orders.isLoading}
          />
        </Can>
        <Can any={['customers:read']}>
          <StatCard
            title="Customers"
            value={formatNumber(customers.data?.total ?? 0)}
            loading={customers.isLoading}
          />
        </Can>
        <Can any={['catalog:read']}>
          <StatCard
            title="Products"
            value={formatNumber(products.data?.total ?? 0)}
            loading={products.isLoading}
          />
        </Can>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Can any={['inventory:read']}>
          <Card>
            <CardBody>
              <Stack gap={3}>
                <Cluster justify="between" align="center">
                  <Heading level={4}>Low stock</Heading>
                  <Link
                    href="/operations/queues"
                    className="font-body text-body-sm text-primary hover:underline"
                  >
                    See queues
                  </Link>
                </Cluster>
                {lowStock.isLoading ? (
                  <Text tone="muted">Loading…</Text>
                ) : !lowStock.data || lowStock.data.data.length === 0 ? (
                  <Text tone="muted">Inventory healthy.</Text>
                ) : (
                  <Stack gap={2}>
                    {lowStock.data.data.map((row) => (
                      <Cluster key={row.variantId} justify="between" align="center">
                        <Stack gap={0}>
                          <Text size="sm" className="font-semibold">
                            {row.productName}
                          </Text>
                          <Text size="sm" tone="muted">
                            SKU {row.sku}
                          </Text>
                        </Stack>
                        <Badge variant="outline">{row.onHand - row.reserved} available</Badge>
                      </Cluster>
                    ))}
                  </Stack>
                )}
              </Stack>
            </CardBody>
          </Card>
        </Can>

        <Can any={['system:audit']}>
          <Card>
            <CardBody>
              <Stack gap={3}>
                <Heading level={4}>Queue health</Heading>
                {queues.isLoading ? (
                  <Text tone="muted">Loading…</Text>
                ) : queues.isError ? (
                  <Alert variant="error">Could not fetch queue health.</Alert>
                ) : (
                  <Stack gap={2}>
                    <Cluster justify="between">
                      <Text size="sm" tone="muted">
                        Active jobs
                      </Text>
                      <Text size="sm" className="font-semibold">
                        {activeJobs}
                      </Text>
                    </Cluster>
                    <Cluster justify="between">
                      <Text size="sm" tone="muted">
                        Failed (last hour)
                      </Text>
                      <Badge variant={failedJobs > 0 ? 'outline' : 'muted'}>{failedJobs}</Badge>
                    </Cluster>
                    <Link
                      href="/operations/queues"
                      className="font-body text-body-sm text-primary hover:underline"
                    >
                      View queues
                    </Link>
                  </Stack>
                )}
              </Stack>
            </CardBody>
          </Card>
        </Can>
      </div>

      <Card>
        <CardBody>
          <Cluster justify="between" align="center">
            <Stack gap={1}>
              <Heading level={4}>System health</Heading>
              <Text tone="muted" size="sm">
                Postgres, Redis, mail. Wired through `/v1/health`.
              </Text>
            </Stack>
            <Link href="/operations/queues">
              <Button variant="outline">Open operations</Button>
            </Link>
          </Cluster>
        </CardBody>
      </Card>
    </Stack>
  );
}
