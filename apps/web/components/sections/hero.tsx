'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  AspectRatio,
  Badge,
  Button,
  Cluster,
  Display,
  Grid,
  Heading,
  Skeleton,
  Stack,
  Text,
} from '@offisdesign/ui';
import { useCmsPage } from '../../lib/hooks';
import { findBlock, str, type Block } from './cms-block';
import { useAnalytics } from '../../lib/providers';

interface HeroPayload {
  eyebrow?: string;
  display?: string;
  title?: string;
  lead?: string;
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
      <Grid cols={2} gap={8}>
        <Stack gap={3}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </Stack>
        <Skeleton className="aspect-[5/4] w-full" rounded="md" />
      </Grid>
    );
  }

  return (
    <Grid cols={2} gap={8}>
      <Stack gap={4} justify="center">
        {hero.eyebrow && <Badge variant="muted">{hero.eyebrow}</Badge>}
        {hero.display && <Display size="lg">{hero.display}</Display>}
        {hero.title && <Heading level={1}>{hero.title}</Heading>}
        {hero.lead && (
          <Text tone="muted" className="max-w-prose">
            {hero.lead}
          </Text>
        )}
        <Cluster gap={3}>
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
              <Button trailingIcon={<ArrowRight width={16} height={16} aria-hidden />}>
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
              <Button variant="outline">{hero.secondaryCta.label}</Button>
            </Link>
          )}
        </Cluster>
      </Stack>
      <AspectRatio ratio={5 / 4} className="bg-primary-subtle rounded-md">
        <div className="text-secondary flex h-full w-full items-center justify-center">
          <Text tone="muted">{str(fromCms, 'mediaAlt') ?? 'Hero artwork'}</Text>
        </div>
      </AspectRatio>
    </Grid>
  );
}
