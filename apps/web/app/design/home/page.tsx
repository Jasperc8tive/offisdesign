'use client';

import { ArrowRight, Leaf, Ruler, Truck } from 'lucide-react';
import {
  AspectRatio,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  Cluster,
  Display,
  Grid,
  Heading,
  Icon,
  PriceTag,
  Stack,
  Text,
} from '@offisdesign/ui';
import { Reveal } from '../_lib/Reveal';

const collections = [
  { name: 'Living', count: 24 },
  { name: 'Dining', count: 18 },
  { name: 'Bedroom', count: 14 },
  { name: 'Workspace', count: 9 },
];

const featured = [
  { name: 'Branch 3-seater sofa', price: 129900, original: 149900 },
  { name: 'Oak dining table', price: 89900 },
  { name: 'Walnut side chair', price: 39900 },
  { name: 'Linen pendant light', price: 24900 },
];

const promises = [
  { icon: Truck, title: 'Free UK delivery', body: 'On orders over £500.' },
  { icon: Leaf, title: 'Responsibly made', body: 'FSC-certified timber, low-impact finishes.' },
  { icon: Ruler, title: 'Made to last', body: '10-year warranty on every frame.' },
];

export default function HomePrototype() {
  return (
    <Stack gap={16}>
      <Reveal>
        <Stack gap={6}>
          <Badge variant="muted">New season</Badge>
          <Display size="lg">Built in Britain.</Display>
          <Heading level={1}>Furniture made to outlast trends.</Heading>
          <Text tone="muted" className="max-w-prose">
            Solid timber, traceable supply chains, ten-year warranties. Designed for everyday life —
            not for landfill.
          </Text>
          <Cluster gap={3}>
            <Button trailingIcon={<ArrowRight width={16} height={16} aria-hidden />}>
              Shop the collection
            </Button>
            <Button variant="outline">Browse journal</Button>
          </Cluster>
        </Stack>
      </Reveal>

      <Reveal>
        <AspectRatio ratio={21 / 9} className="bg-primary-subtle rounded-md">
          <div className="flex h-full w-full items-center justify-center">
            <Text tone="muted">Hero image placeholder</Text>
          </div>
        </AspectRatio>
      </Reveal>

      <Reveal>
        <Stack gap={4}>
          <Heading level={2}>Shop by room</Heading>
          <Grid cols={4} gap={4}>
            {collections.map((c) => (
              <Card interactive key={c.name} tabIndex={0}>
                <AspectRatio ratio={4 / 5} className="bg-primary-subtle rounded-t-md" />
                <CardFooter className="border-t-0 pt-4">
                  <Text className="text-secondary font-semibold">{c.name}</Text>
                  <Text size="sm" tone="muted">
                    {c.count} items
                  </Text>
                </CardFooter>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Reveal>

      <Reveal>
        <Stack gap={4}>
          <Cluster justify="between" align="end">
            <Heading level={2}>Featured pieces</Heading>
            <Button variant="link" trailingIcon={<ArrowRight width={16} height={16} aria-hidden />}>
              See all
            </Button>
          </Cluster>
          <Grid cols={4} gap={4}>
            {featured.map((p) => (
              <Card key={p.name} interactive tabIndex={0}>
                <AspectRatio ratio={1} className="bg-primary-subtle rounded-t-md" />
                <CardBody>
                  <Stack gap={1}>
                    <Text className="text-secondary font-semibold">{p.name}</Text>
                    <PriceTag amount={p.price} originalAmount={p.original} size="sm" />
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Reveal>

      <Reveal>
        <Grid cols={3} gap={4}>
          {promises.map((p) => (
            <Card key={p.title}>
              <CardBody>
                <Stack gap={2}>
                  <Icon icon={p.icon} size="lg" decorative className="text-primary" />
                  <Heading level={4}>{p.title}</Heading>
                  <Text size="sm" tone="muted">
                    {p.body}
                  </Text>
                </Stack>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </Reveal>
    </Stack>
  );
}
