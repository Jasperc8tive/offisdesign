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
  { tag: 'Ergonomics', title: 'How to choose an ergonomic office chair' },
  { tag: 'Process', title: 'Inside our Lagos workshop' },
  { tag: 'Planning', title: 'Planning a productive office layout' },
];

export default function BlogPrototype() {
  return (
    <Stack gap={8}>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Journal', href: '#' },
          { label: 'Designing for productivity' },
        ]}
      />

      <Reveal>
        <Stack gap={3}>
          <Cluster gap={2}>
            <Badge variant="muted">Workspace</Badge>
            <Text size="sm" tone="muted">
              6 min read · 02 March 2026
            </Text>
          </Cluster>
          <Heading level={1}>Designing a workspace that performs.</Heading>
          <Cluster gap={3} align="center">
            <Avatar initials="AO" alt="Adaeze Okafor" />
            <Stack gap={0}>
              <Text size="sm" className="text-secondary font-semibold">
                Adaeze Okafor
              </Text>
              <Text size="sm" tone="muted">
                Head of workspace design
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
                A workspace is a tool, and like any tool it either helps people do their best work
                or quietly gets in the way. The best offices we design start from how teams actually
                work — not from a furniture catalogue.
              </Text>
              <Heading level={3}>Start with how people work</Heading>
              <Text>
                Before specifying a single desk, we map how the team moves through a day: focus
                work, quick huddles, scheduled meetings, and downtime. The right mix of zones — and
                the seating to match — does more for productivity than any single statement piece.
              </Text>
              <Heading level={3}>Build for the long term</Heading>
              <Text>
                Teams grow and reorganise, so we plan for change. Modular workstations, adaptable
                storage, and commercial-grade finishes mean the space keeps working as the business
                does — backed by warranty and after-sales support.
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
                    {['Start with how people work', 'Build for the long term', 'Reading more'].map(
                      (h) => (
                        <li key={h}>
                          <a
                            href={`#${h.toLowerCase().replace(/\s+/g, '-')}`}
                            className="font-body text-body-sm text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:ring-primary block rounded-sm px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2"
                          >
                            {h}
                          </a>
                        </li>
                      ),
                    )}
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
