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
  { name: 'Desks', count: 24 },
  { name: 'Seating', count: 18 },
  { name: 'Meeting', count: 14 },
  { name: 'Storage', count: 9 },
];

const featured = [
  { name: 'Executive desk', price: 48500000, original: 56500000 },
  { name: 'Ergonomic task chair', price: 18500000 },
  { name: 'Conference table', price: 65000000 },
  { name: 'Storage credenza', price: 24000000 },
];

const promises = [
  { icon: Truck, title: 'Delivery & installation', body: 'Professional fit-out across Nigeria.' },
  { icon: Leaf, title: 'Responsibly made', body: 'Durable, commercial-grade materials.' },
  { icon: Ruler, title: 'Warranty & support', body: 'Backed by warranty and after-sales support.' },
];

export default function HomePrototype() {
  return (
    <Stack gap={16}>
      <Reveal>
        <Stack gap={6}>
          <Badge variant="muted">New arrivals</Badge>
          <Display size="lg">Where better work begins.</Display>
          <Heading level={1}>Premium office furniture and workspace solutions.</Heading>
          <Text tone="muted" className="max-w-prose">
            Ergonomic desks, task seating, and meeting spaces — designed, delivered, and installed
            for the way your team works.
          </Text>
          <Cluster gap={3}>
            <Button trailingIcon={<ArrowRight width={16} height={16} aria-hidden />}>
              Shop the collection
            </Button>
            <Button variant="outline">Book a consultation</Button>
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
          <Heading level={2}>Shop by workspace</Heading>
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
