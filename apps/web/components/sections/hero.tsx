'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import {
  AspectRatio,
  Button,
  Cluster,
  Display,
  Heading,
  Icon,
  Skeleton,
  Stack,
  Text,
} from '@offisdesign/ui';
import { useCmsPage } from '../../lib/hooks';
import { findBlock, str, type Block } from './cms-block';
import { Media } from '../media/media';
import { resolveMediaUrl } from '../../lib/media/url';
import { useAnalytics } from '../../lib/providers';

interface HeroPayload {
  eyebrow?: string;
  display?: string;
  title?: string;
  lead?: string;
  mediaId?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

const DEFAULT_HERO: HeroPayload = {
  eyebrow: 'New season',
  display: 'Built in Britain.',
  title: 'Furniture made to outlast trends.',
  lead: 'Solid timber, traceable supply chains, ten-year warranties. Designed for everyday life — not for landfill.',
  primaryCta: { label: 'Shop the collection', href: '/search' },
  secondaryCta: { label: 'Browse journal', href: '/journal' },
};

/**
 * CMS-driven hero. Looks for a `hero` block on the published `home` CMS page;
 * falls back to a sensible default so a fresh deploy is never blank.
 */
export function Hero() {
  const { data, isLoading } = useCmsPage('home');
  const { track } = useAnalytics();
  const blocks = (data?.blocks as Block[] | undefined) ?? undefined;
  const fromCms = findBlock<HeroPayload>(blocks, 'hero');
  const hero: HeroPayload = fromCms ?? DEFAULT_HERO;

  if (isLoading && !data) {
    return (
      <section className="pb-12 pt-4 md:pb-20 md:pt-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Stack gap={4}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-11 w-48" />
          </Stack>
          <Skeleton className="aspect-[4/5] w-full lg:aspect-[5/6]" rounded="md" />
        </div>
      </section>
    );
  }

  return (
    <section className="pb-12 pt-4 md:pb-20 md:pt-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Copy */}
        <Stack gap={4} className="order-1">
          {hero.eyebrow && (
            <Text size="sm" tone="primary" className="font-semibold uppercase tracking-[0.18em]">
              {hero.eyebrow}
            </Text>
          )}
          {hero.display && (
            <Display size="xl" className="leading-[0.95]">
              {hero.display}
            </Display>
          )}
          {hero.title && (
            <Heading level={2} className="text-secondary max-w-[18ch] font-normal">
              {hero.title}
            </Heading>
          )}
          {hero.lead && (
            <Text tone="muted" className="max-w-prose">
              {hero.lead}
            </Text>
          )}
          <Cluster gap={4} align="center" className="pt-1">
            {hero.primaryCta && (
              <Link
                href={hero.primaryCta.href}
                onClick={() =>
                  track('cta_click', {
                    id: 'hero-primary',
                    location: 'hero',
                    href: hero.primaryCta?.href ?? '',
                  })
                }
              >
                <Button size="lg" trailingIcon={<ArrowRight width={16} height={16} aria-hidden />}>
                  {hero.primaryCta.label}
                </Button>
              </Link>
            )}
            {hero.secondaryCta && (
              <Link
                href={hero.secondaryCta.href}
                onClick={() =>
                  track('cta_click', {
                    id: 'hero-secondary',
                    location: 'hero',
                    href: hero.secondaryCta?.href ?? '',
                  })
                }
              >
                <Button
                  variant="link"
                  trailingIcon={<ArrowRight width={16} height={16} aria-hidden />}
                >
                  {hero.secondaryCta.label}
                </Button>
              </Link>
            )}
          </Cluster>
          {/* Trust microcopy — quiet reassurance under the fold-line */}
          <Cluster gap={6} className="text-muted pt-3">
            <span className="font-body text-body-sm inline-flex items-center gap-2">
              <Icon icon={Truck} size="sm" decorative className="text-primary" />
              Free UK delivery over £500
            </span>
            <span className="font-body text-body-sm inline-flex items-center gap-2">
              <Icon icon={ShieldCheck} size="sm" decorative className="text-primary" />
              Ten-year warranty
            </span>
          </Cluster>
        </Stack>

        {/* Media — real photography when configured, brand placeholder otherwise */}
        <div className="order-2">
          <AspectRatio ratio={4 / 5} className="bg-primary-subtle rounded-lg lg:aspect-[5/6]">
            <Media
              mediaId={hero.mediaId}
              alt={hero.display ?? 'Offisdesign'}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            {!resolveMediaUrl(hero.mediaId) && (
              <div className="text-muted flex h-full w-full items-end p-5">
                <Text size="caption" tone="muted" className="uppercase tracking-[0.18em]">
                  {str(fromCms, 'mediaAlt') ?? 'Made in Yorkshire'}
                </Text>
              </div>
            )}
          </AspectRatio>
        </div>
      </div>
    </section>
  );
}
