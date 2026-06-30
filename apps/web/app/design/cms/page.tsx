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
          <Display size="md">From brief to installation.</Display>
          <Heading level={1}>How OFFISDESIGN furniture is made.</Heading>
          <Text tone="muted" className="max-w-prose">
            Precision-built for the workplace and quality-checked at every step — designed, made,
            and finished by our team in Lagos.
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
                We build with commercial-grade materials chosen for daily use — engineered timber
                and steel frames, scratch- and stain-resistant work surfaces, and high-durability
                upholstery rated for the workplace.
              </Text>
              <Text>
                Finishes are selected for comfort and longevity across long working days, then
                matched to your brand and interior during the planning stage. Nothing ships until it
                has passed our quality checks.
              </Text>
              <Divider />
              <Heading level={2}>The process</Heading>
              <Text>
                Every order is planned around your space. We confirm layouts and specifications,
                build and quality-check, then deliver and install on site — followed by warranty and
                after-sales support.
              </Text>
            </Stack>
          </div>
          <aside>
            <Card>
              <CardBody>
                <Stack gap={3}>
                  <Heading level={4}>At a glance</Heading>
                  <Stack gap={2}>
                    <Cluster justify="between">
                      <Text size="sm" tone="muted">
                        Founded
                      </Text>
                      <Text size="sm">2018</Text>
                    </Cluster>
                    <Cluster justify="between">
                      <Text size="sm" tone="muted">
                        Team
                      </Text>
                      <Text size="sm">22</Text>
                    </Cluster>
                    <Cluster justify="between">
                      <Text size="sm" tone="muted">
                        Projects delivered (2025)
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
              { n: '500+', l: 'Workspaces furnished across Lagos' },
              { n: '48h', l: 'Consultation response time' },
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
