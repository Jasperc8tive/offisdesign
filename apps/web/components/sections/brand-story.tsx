'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AspectRatio, Button, Display, Grid, Heading, Stack, Text } from '@offisdesign/ui';
import { useCmsPage } from '../../lib/hooks';
import { findBlock, type Block } from './cms-block';
import { useAnalytics } from '../../lib/providers';

interface StoryPayload {
  display?: string;
  title?: string;
  lead?: string;
  href?: string;
  cta?: string;
}

const DEFAULT: StoryPayload = {
  display: 'From workshop to home.',
  title: 'A traceable supply chain, end to end.',
  lead: 'FSC timber, washable linens, ten-year warranties. Made by hand in our Yorkshire workshop.',
  href: '/about',
  cta: 'Read the story',
};

export function BrandStory() {
  const { data } = useCmsPage('home');
  const fromCms = findBlock<StoryPayload>(data?.blocks as Block[] | undefined, 'brand_story');
  const story = fromCms ?? DEFAULT;
  const { track } = useAnalytics();

  return (
    <Grid cols={2} gap={8}>
      <AspectRatio ratio={4 / 3} className="bg-primary-subtle rounded-md" />
      <Stack gap={3} justify="center">
        {story.display && <Display size="md">{story.display}</Display>}
        {story.title && <Heading level={2}>{story.title}</Heading>}
        {story.lead && (
          <Text tone="muted" className="max-w-prose">
            {story.lead}
          </Text>
        )}
        {story.href && story.cta && (
          <Link
            href={story.href}
            onClick={() =>
              track('cta_click', {
                id: 'brand-story',
                location: 'brand_story',
                href: story.href ?? '',
              })
            }
          >
            <Button
              variant="outline"
              trailingIcon={<ArrowRight width={16} height={16} aria-hidden />}
            >
              {story.cta}
            </Button>
          </Link>
        )}
      </Stack>
    </Grid>
  );
}
