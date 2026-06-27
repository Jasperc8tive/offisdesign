'use client';

import { Leaf, Ruler, Truck } from 'lucide-react';
import { Card, CardBody, Grid, Heading, Icon, Stack, Text } from '@offisdesign/ui';

const PROMISES = [
  { icon: Truck, title: 'Free UK delivery', body: 'On orders over £500.' },
  { icon: Leaf, title: 'Responsibly made', body: 'FSC-certified timber, low-impact finishes.' },
  { icon: Ruler, title: 'Made to last', body: '10-year warranty on every frame.' },
];

export function TrustIndicators() {
  return (
    <Grid cols={3} gap={4}>
      {PROMISES.map((p) => (
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
  );
}
