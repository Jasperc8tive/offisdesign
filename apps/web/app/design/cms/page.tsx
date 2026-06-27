'use client';

import {
  AspectRatio,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  Cluster,
  Display,
  Divider,
  Grid,
  Heading,
  Stack,
  Text,
} from '@offisdesign/ui';
import { Reveal } from '../_lib/Reveal';

export default function CmsPrototype() {
  return (
    <Stack gap={8}>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Our story' }]} />

      <Reveal>
        <Stack gap={3}>
          <Badge variant="muted">Story</Badge>
          <Display size="md">From workshop to home.</Display>
          <Heading level={1}>How Branch furniture is made.</Heading>
          <Text tone="muted" className="max-w-prose">
            A traceable supply chain from FSC timber to washable linens. Every piece is jointed,
            sanded, and finished by makers in our Yorkshire workshop.
          </Text>
        </Stack>
      </Reveal>

      <Reveal>
        <AspectRatio ratio={21 / 9} className="bg-primary-subtle rounded-md" />
      </Reveal>

      <Reveal>
        <Grid cols={3} gap={6}>
          <div className="lg:col-span-2">
            <Stack gap={4}>
              <Heading level={2}>The materials</Heading>
              <Text>
                We start with kiln-dried European oak, traceable from forest to frame. Each board is
                graded for grain consistency before being jointed by hand. Off-cuts are kept and
                routed into small homeware — nothing leaves the workshop until it has a use.
              </Text>
              <Text>
                Linens come from a single Belgian mill that has run on hydro-electric power since
                1947. We choose flax over cotton everywhere we can — it uses a tenth of the water
                and grows in our climate.
              </Text>
              <Divider />
              <Heading level={2}>The process</Heading>
              <Text>
                Frames are bench-jointed and screwed; no nails. Cushions are filled with a feather
                and silk-fibre blend held in linen ticking. Covers are removable for washing or
                replacement, so a sofa can outlive its first life — and its second.
              </Text>
            </Stack>
          </div>
          <aside>
            <Card>
              <CardBody>
                <Stack gap={3}>
                  <Heading level={4}>Workshop facts</Heading>
                  <Stack gap={2}>
                    <Cluster justify="between">
                      <Text size="sm" tone="muted">
                        Founded
                      </Text>
                      <Text size="sm">2018</Text>
                    </Cluster>
                    <Cluster justify="between">
                      <Text size="sm" tone="muted">
                        Makers
                      </Text>
                      <Text size="sm">22</Text>
                    </Cluster>
                    <Cluster justify="between">
                      <Text size="sm" tone="muted">
                        Pieces made (2025)
                      </Text>
                      <Text size="sm">3,114</Text>
                    </Cluster>
                    <Cluster justify="between">
                      <Text size="sm" tone="muted">
                        Warranty
                      </Text>
                      <Text size="sm">10 years</Text>
                    </Cluster>
                  </Stack>
                </Stack>
              </CardBody>
            </Card>
          </aside>
        </Grid>
      </Reveal>

      <Reveal>
        <Stack gap={4}>
          <Heading level={2}>By the numbers</Heading>
          <Grid cols={3} gap={4}>
            {[
              { n: '94%', l: 'Materials recyclable or reusable' },
              { n: '0%', l: 'Single-use plastic in packaging' },
              { n: '10y', l: 'Warranty across the catalogue' },
            ].map((s) => (
              <Card key={s.l}>
                <CardBody>
                  <Stack gap={1}>
                    <Display size="md" as="span">
                      {s.n}
                    </Display>
                    <Text tone="muted">{s.l}</Text>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Reveal>
    </Stack>
  );
}
