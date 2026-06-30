'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AspectRatio, Button, Display, Stack, Text } from '@offisdesign/ui';
import { useCmsPage } from '../../lib/hooks';
import { findBlock, type Block } from './cms-block';
import { useAnalytics } from '../../lib/providers';

interface StoryPayload {
  eyebrow?: string;
  display?: string;
  title?: string;
  lead?: string;
  href?: string;
  cta?: string;
}

const DEFAULT: StoryPayload = {
  eyebrow: 'Our craft',
  display: 'From workshop to home.',
  title: 'A traceable supply chain, end to end.',
  lead: 'FSC timber, washable linens, ten-year warranties. Made by hand in our Yorkshire workshop — and built to be repaired, not replaced.',
  href: '/about',
  cta: 'Read the story',
};

export function BrandStory() {
  const { data } = useCmsPage('home');
  const fromCms = findBlock<StoryPayload>(data?.blocks as Block[] | undefined, 'brand_story');
  const story = fromCms ?? DEFAULT;
  const { track } = useAnalytics();

  return (
    <section className="py-10 md:py-14">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <AspectRatio ratio={4 / 3} className="bg-primary-subtle rounded-lg lg:aspect-[5/4]" />
        <Stack gap={4} justify="center">
          {story.eyebrow && (
            <Text size="sm" tone="primary" className="font-semibold uppercase tracking-[0.18em]">
              {story.eyebrow}
            </Text>
          )}
          {story.display && <Display size="md">{story.display}</Display>}
          {story.title && (
            <Text className="font-heading text-h4 text-secondary">{story.title}</Text>
          )}
          {story.lead && (
            <Text tone="muted" className="max-w-prose">
              {story.lead}
            </Text>
          )}
          {story.href && story.cta && (
            <div className="pt-1">
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
            </div>
          )}
        </Stack>
      </div>
    </section>
  );
}
