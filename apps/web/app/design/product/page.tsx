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
  const [wood, setWood] = useState('oak');

  return (
    <Stack gap={8}>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '#' },
          { label: 'Sofas', href: '#' },
          { label: 'Branch 3-seater' },
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
          <Heading level={1}>Branch 3-seater sofa</Heading>
          <Rating value={4.5} reviewCount={128} />
          <PriceTag amount={129900} originalAmount={149900} size="lg" />
          <Text tone="muted">
            A flat-pack three-seater built around a solid oak frame. Removable linen covers,
            washable filling, ten-year warranty.
          </Text>

          <Stack gap={2}>
            <Text className="text-secondary font-semibold">Wood finish</Text>
            <Swatch
              name="Wood"
              value={wood}
              onChange={setWood}
              options={[
                { value: 'oak', label: 'Oak', color: '#C9A66B' },
                { value: 'walnut', label: 'Walnut', color: '#5C3A21' },
                { value: 'ash', label: 'Ash', color: '#E8DCC2' },
                { value: 'black', label: 'Black', color: '#1A1A1A' },
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

          <Alert variant="info" title="Delivery 3–5 weeks">
            <Cluster gap={2} align="center">
              <Icon icon={Truck} size="sm" decorative />
              <Text size="sm">Free UK delivery on orders over £500.</Text>
            </Cluster>
          </Alert>
        </Stack>
      </Grid>

      <Tabs defaultValue="details">
        <TabList label="Product info">
          <Tab value="details">Details</Tab>
          <Tab value="materials">Materials</Tab>
          <Tab value="delivery">Delivery</Tab>
          <Tab value="reviews">Reviews</Tab>
        </TabList>
        <TabPanel value="details">
          <Text>
            The Branch 3-seater is built around a solid kiln-dried hardwood frame, jointed and
            screwed for life-long stability. Cushions are sprung beneath a high-resilience foam core
            wrapped in feather and silk fibre.
          </Text>
        </TabPanel>
        <TabPanel value="materials">
          <Text>FSC-certified oak, washable linen, recycled-feather fibre.</Text>
        </TabPanel>
        <TabPanel value="delivery">
          <Text>3–5 weeks to UK mainland. White-glove room of choice available.</Text>
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
                  <PriceTag amount={49900 + n * 5000} size="sm" />
                </Stack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </Stack>
    </Stack>
  );
}
