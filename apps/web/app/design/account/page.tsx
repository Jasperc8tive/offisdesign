'use client';

import { useState } from 'react';
import { Package, MapPin, Heart, Settings } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Cluster,
  Divider,
  EmptyState,
  Grid,
  Heading,
  Icon,
  PriceTag,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
} from '@offisdesign/ui';

const orders = [
  {
    id: 'OD-1042',
    placedAt: '12 Mar 2026',
    status: 'Delivered',
    total: 209700,
    items: 'Branch 3-seater · Walnut chair × 2',
  },
  {
    id: 'OD-0987',
    placedAt: '02 Feb 2026',
    status: 'Shipped',
    total: 89900,
    items: 'Oak dining table',
  },
];

export default function AccountPrototype() {
  const [news, setNews] = useState(true);
  const [restock, setRestock] = useState(false);
  return (
    <Stack gap={6}>
      <Cluster gap={4} align="center">
        <Avatar initials="MD" size="xl" alt="Mayowa D." />
        <Stack gap={1}>
          <Heading level={2}>Welcome back, Mayowa</Heading>
          <Text tone="muted">Member since 2024 · 4 orders</Text>
        </Stack>
      </Cluster>

      <Tabs defaultValue="orders">
        <TabList label="Account sections">
          <Tab value="orders">Orders</Tab>
          <Tab value="addresses">Addresses</Tab>
          <Tab value="wishlist">Wishlist</Tab>
          <Tab value="prefs">Preferences</Tab>
        </TabList>

        <TabPanel value="orders">
          <Stack gap={3}>
            {orders.map((o) => (
              <Card key={o.id}>
                <CardBody>
                  <Cluster justify="between" align="center" wrap>
                    <Stack gap={1}>
                      <Cluster gap={2} align="center">
                        <Icon icon={Package} decorative className="text-primary" />
                        <Text className="text-secondary font-semibold">{o.id}</Text>
                        <Badge variant={o.status === 'Delivered' ? 'muted' : 'primary'}>
                          {o.status}
                        </Badge>
                      </Cluster>
                      <Text size="sm" tone="muted">
                        Placed {o.placedAt} · {o.items}
                      </Text>
                    </Stack>
                    <Cluster gap={3} align="center">
                      <PriceTag amount={o.total} />
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Cluster>
                  </Cluster>
                </CardBody>
              </Card>
            ))}
          </Stack>
        </TabPanel>

        <TabPanel value="addresses">
          <Grid cols={2} gap={4}>
            <Card>
              <CardHeader>
                <Cluster gap={2} align="center">
                  <Icon icon={MapPin} decorative className="text-primary" />
                  <Heading level={4}>Home</Heading>
                  <Badge variant="muted">Default</Badge>
                </Cluster>
              </CardHeader>
              <CardBody>
                <Text size="sm">
                  Mayowa D.
                  <br />
                  12 Branch Lane
                  <br />
                  London E2 7AB
                  <br />
                  United Kingdom
                </Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <EmptyState
                  title="Add a second address"
                  description="Save another delivery destination for faster checkout."
                  action={<Button size="sm">Add address</Button>}
                />
              </CardBody>
            </Card>
          </Grid>
        </TabPanel>

        <TabPanel value="wishlist">
          <EmptyState
            icon={<Icon icon={Heart} size="xl" decorative />}
            title="Your wishlist is empty"
            description="Save pieces you love to come back to later."
            action={<Button>Start browsing</Button>}
          />
        </TabPanel>

        <TabPanel value="prefs">
          <Stack gap={4}>
            <Card>
              <CardHeader>
                <Cluster gap={2} align="center">
                  <Icon icon={Settings} decorative className="text-primary" />
                  <Heading level={4}>Communication</Heading>
                </Cluster>
              </CardHeader>
              <CardBody>
                <Stack gap={4}>
                  <Switch
                    checked={news}
                    onCheckedChange={setNews}
                    label="Email newsletter — new collections & journal posts"
                  />
                  <Divider />
                  <Switch
                    checked={restock}
                    onCheckedChange={setRestock}
                    label="Notify me when wishlist items are back in stock"
                  />
                </Stack>
              </CardBody>
            </Card>
          </Stack>
        </TabPanel>
      </Tabs>
    </Stack>
  );
}
