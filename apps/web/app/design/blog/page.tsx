'use client';

import {
  AspectRatio,
  Avatar,
  Badge,
  Breadcrumb,
  Card,
  CardBody,
  Cluster,
  Divider,
  Grid,
  Heading,
  Stack,
  Text,
} from '@offisdesign/ui';
import { Reveal } from '../_lib/Reveal';

const related = [
  { tag: 'Materials', title: 'Why we choose linen over cotton' },
  { tag: 'Process', title: 'Inside the Yorkshire workshop' },
  { tag: 'Stories', title: 'Living with the same sofa for ten years' },
];

export default function BlogPrototype() {
  return (
    <Stack gap={8}>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Journal', href: '#' },
          { label: 'Why we choose oak' },
        ]}
      />

      <Reveal>
        <Stack gap={3}>
          <Cluster gap={2}>
            <Badge variant="muted">Materials</Badge>
            <Text size="sm" tone="muted">
              6 min read · 02 March 2026
            </Text>
          </Cluster>
          <Heading level={1}>Why we choose oak — and what we leave behind.</Heading>
          <Cluster gap={3} align="center">
            <Avatar initials="EH" alt="Ella Harris" />
            <Stack gap={0}>
              <Text size="sm" className="text-secondary font-semibold">
                Ella Harris
              </Text>
              <Text size="sm" tone="muted">
                Head of materials
              </Text>
            </Stack>
          </Cluster>
        </Stack>
      </Reveal>

      <Reveal>
        <AspectRatio ratio={21 / 9} className="bg-primary-subtle rounded-md" />
      </Reveal>

      <Reveal>
        <Grid cols={3} gap={8}>
          <article className="prose lg:col-span-2">
            <Stack gap={4}>
              <Text>
                Oak is one of the slowest-growing hardwoods we work with, and that is precisely the
                point. Slow growth means tight grain, and tight grain means a frame that will keep
                its shape for decades.
              </Text>
              <Heading level={3}>Where it comes from</Heading>
              <Text>
                Every plank we buy is FSC-certified and traceable to a managed forest in France or
                Germany. We avoid Eastern European stock — not because the trees are bad, but
                because the chain of custody is harder to verify.
              </Text>
              <Heading level={3}>What we leave behind</Heading>
              <Text>
                Off-cuts are routed into homeware. Sawdust feeds the workshop biomass boiler. The
                only thing we discard is the bark, which goes to a local mulch supplier.
              </Text>
              <Divider />
              <Text size="sm" tone="muted">
                Last updated 02 March 2026
              </Text>
            </Stack>
          </article>

          <aside>
            <Card className="sticky top-24">
              <CardBody>
                <Stack gap={3}>
                  <Heading level={4}>In this article</Heading>
                  <Stack gap={1} as="ul">
                    {['Where it comes from', 'What we leave behind', 'Reading more'].map((h) => (
                      <li key={h}>
                        <a
                          href={`#${h.toLowerCase().replace(/\s+/g, '-')}`}
                          className="font-body text-body-sm text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:ring-primary block rounded-sm px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2"
                        >
                          {h}
                        </a>
                      </li>
                    ))}
                  </Stack>
                </Stack>
              </CardBody>
            </Card>
          </aside>
        </Grid>
      </Reveal>

      <Reveal>
        <Stack gap={4}>
          <Heading level={2}>Related reading</Heading>
          <Grid cols={3} gap={4}>
            {related.map((r) => (
              <Card key={r.title} interactive tabIndex={0}>
                <AspectRatio ratio={16 / 9} className="bg-primary-subtle rounded-t-md" />
                <CardBody>
                  <Stack gap={1}>
                    <Badge variant="muted">{r.tag}</Badge>
                    <Text className="text-secondary font-semibold">{r.title}</Text>
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
