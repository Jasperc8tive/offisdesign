'use client';

import { useState } from 'react';
import { Heart, ShoppingBag, Truck } from 'lucide-react';
import {
  Alert,
  AspectRatio,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardBody,
  Cluster,
  Grid,
  Heading,
  Icon,
  PriceTag,
  Quantity,
  Rating,
  Stack,
  Swatch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  Tooltip,
} from '@offisdesign/ui';

export default function ProductPrototype() {
  const [qty, setQty] = useState(1);
  const [finish, setFinish] = useState('black');

  return (
    <Stack gap={8}>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '#' },
          { label: 'Office chairs', href: '#' },
          { label: 'Aria task chair' },
        ]}
      />

      <Grid cols={2} gap={8}>
        <Stack gap={2}>
          <AspectRatio ratio={4 / 5} className="bg-primary-subtle rounded-md" />
          <Grid cols={4} gap={2}>
            {[0, 1, 2, 3].map((i) => (
              <AspectRatio key={i} ratio={1} className="bg-primary-subtle rounded-sm" />
            ))}
          </Grid>
        </Stack>

        <Stack gap={4}>
          <Cluster gap={2}>
            <Badge>New</Badge>
            <Badge variant="muted">Limited stock</Badge>
          </Cluster>
          <Heading level={1}>Aria ergonomic task chair</Heading>
          <Rating value={4.5} reviewCount={128} />
          <PriceTag amount={18500000} originalAmount={22500000} size="lg" />
          <Text tone="muted">
            A fully adjustable task chair with breathable mesh back, dynamic lumbar support, and a
            4D armrest system. Built for full working days and backed by warranty.
          </Text>

          <Stack gap={2}>
            <Text className="text-secondary font-semibold">Frame finish</Text>
            <Swatch
              name="Frame finish"
              value={finish}
              onChange={setFinish}
              options={[
                { value: 'black', label: 'Black', color: '#1A1A1A' },
                { value: 'graphite', label: 'Graphite', color: '#3F4246' },
                { value: 'silver', label: 'Silver', color: '#C4C7CC' },
                { value: 'white', label: 'White', color: '#F2F2F0' },
              ]}
            />
          </Stack>

          <Stack gap={2}>
            <Text className="text-secondary font-semibold">Quantity</Text>
            <Cluster gap={3} align="center">
              <Quantity value={qty} onChange={setQty} />
              <Tooltip content="Save to wishlist">
                <Button variant="outline" aria-label="Save to wishlist">
                  <Icon icon={Heart} decorative />
                </Button>
              </Tooltip>
            </Cluster>
          </Stack>

          <Button
            size="lg"
            fullWidth
            leadingIcon={<ShoppingBag width={18} height={18} aria-hidden />}
          >
            Add to bag
          </Button>

          <Alert variant="info" title="Delivery & installation">
            <Cluster gap={2} align="center">
              <Icon icon={Truck} size="sm" decorative />
              <Text size="sm">Delivery and installation across Nigeria.</Text>
            </Cluster>
          </Alert>
        </Stack>
      </Grid>

      <Tabs defaultValue="details">
        <TabList label="Product info">
          <Tab value="details">Details</Tab>
          <Tab value="materials">Materials &amp; care</Tab>
          <Tab value="delivery">Delivery &amp; installation</Tab>
          <Tab value="reviews">Reviews</Tab>
        </TabList>
        <TabPanel value="details">
          <Text>
            The Aria task chair pairs a breathable mesh back with a contoured foam seat for support
            across long working days. Synchronised tilt, seat-height and depth adjustment, and 4D
            armrests adapt to each person at the desk.
          </Text>
        </TabPanel>
        <TabPanel value="materials">
          <Text>
            Breathable mesh back, moulded foam seat, powder-coated steel base, nylon castors.
          </Text>
        </TabPanel>
        <TabPanel value="delivery">
          <Text>Delivered and professionally installed across Nigeria.</Text>
        </TabPanel>
        <TabPanel value="reviews">
          <Text>128 reviews, average 4.5 / 5.</Text>
        </TabPanel>
      </Tabs>

      <Stack gap={4}>
        <Heading level={2}>You may also like</Heading>
        <Grid cols={4} gap={4}>
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} interactive tabIndex={0}>
              <AspectRatio ratio={1} className="bg-primary-subtle rounded-t-md" />
              <CardBody>
                <Stack gap={1}>
                  <Text className="text-secondary font-semibold">Companion piece {n}</Text>
                  <PriceTag amount={8500000 + n * 1500000} size="sm" />
                </Stack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </Stack>
    </Stack>
  );
}
