'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AspectRatio, Button, Display, Stack, Text } from '@offisdesign/ui';
import { useCmsPage } from '../../lib/hooks';
import { findBlock, type Block } from './cms-block';
import { Media } from '../media/media';
import { STOCK } from '../../lib/media/stock';
import { BRAND_CONTACT } from '../../lib/brand/contact';
import { useAnalytics } from '../../lib/providers';

interface StoryPayload {
  eyebrow?: string;
  display?: string;
  title?: string;
  lead?: string;
  href?: string;
  cta?: string;
  mediaId?: string;
}

const DEFAULT: StoryPayload = {
  eyebrow: 'Why OFFISDESIGN',
  display: 'More than furniture — environments that perform.',
  title: 'From consultation to installation.',
  lead: 'We partner with businesses to plan, furnish, and install offices that reflect ambition and support productivity — with attentive support long after handover.',
  href: BRAND_CONTACT.whatsapp,
  cta: 'Talk to our team',
};

export function BrandStory() {
  const { data } = useCmsPage('home');
  const fromCms = findBlock<StoryPayload>(data?.blocks as Block[] | undefined, 'brand_story');
  const story = fromCms ?? DEFAULT;
  const { track } = useAnalytics();

  return (
    <section className="py-10 md:py-14">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <AspectRatio ratio={4 / 3} className="bg-primary-subtle rounded-lg lg:aspect-[5/4]">
          <Media
            mediaId={story.mediaId}
            src={STOCK.brandStory.src}
            alt={STOCK.brandStory.alt}
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </AspectRatio>
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
                {...(story.href.startsWith('http')
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
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
