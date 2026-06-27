'use client';

import Link from 'next/link';
import { Button, Container, Display, Stack, Text } from '@offisdesign/ui';
import { useCmsPage } from '../../lib/hooks';
import { findBlock, type Block } from './cms-block';
import { useAnalytics } from '../../lib/providers';

interface BannerPayload {
  eyebrow?: string;
  title?: string;
  body?: string;
  href?: string;
  cta?: string;
}

const DEFAULT: BannerPayload = {
  eyebrow: 'Limited time',
  title: 'Spring sale',
  body: 'Save up to 20% on selected pieces.',
  href: '/search?sort=recent',
  cta: 'Shop the sale',
};

export function PromoBanner() {
  const { data } = useCmsPage('home');
  const fromCms = findBlock<BannerPayload>(data?.blocks as Block[] | undefined, 'promo_banner');
  const banner = fromCms ?? DEFAULT;
  const { track } = useAnalytics();
  if (!banner.title && !banner.body) return null;

  return (
    <section className="bg-secondary text-on-dark">
      <Container className="py-12">
        <Stack gap={3} align="center" className="text-center">
          {banner.eyebrow && (
            <Text size="sm" tone="inverse" className="uppercase tracking-wide">
              {banner.eyebrow}
            </Text>
          )}
          {banner.title && <Display size="md">{banner.title}</Display>}
          {banner.body && (
            <Text tone="inverse" className="max-w-prose">
              {banner.body}
            </Text>
          )}
          {banner.href && banner.cta && (
            <Link
              href={banner.href}
              onClick={() =>
                track('cta_click', {
                  id: 'promo-banner',
                  location: 'promo_banner',
                  href: banner.href ?? '',
                })
              }
            >
              <Button variant="primary">{banner.cta}</Button>
            </Link>
          )}
        </Stack>
      </Container>
    </section>
  );
}
