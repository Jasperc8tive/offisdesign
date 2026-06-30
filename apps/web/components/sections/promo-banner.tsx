'use client';

import Link from 'next/link';
import { Button, Container, Display, PageSection, Stack, Text } from '@offisdesign/ui';
import { useCmsPage } from '../../lib/hooks';
import { findBlock, type Block } from './cms-block';
import { BRAND_CONTACT } from '../../lib/brand/contact';
import { useAnalytics } from '../../lib/providers';

interface BannerPayload {
  eyebrow?: string;
  title?: string;
  body?: string;
  href?: string;
  cta?: string;
}

const DEFAULT: BannerPayload = {
  eyebrow: 'Workspace planning',
  title: 'Let’s design your office',
  body: 'From space planning to furniture and professional installation, our team partners with you end to end.',
  href: BRAND_CONTACT.whatsapp,
  cta: 'Book a consultation',
};

export function PromoBanner() {
  const { data } = useCmsPage('home');
  const fromCms = findBlock<BannerPayload>(data?.blocks as Block[] | undefined, 'promo_banner');
  const banner = fromCms ?? DEFAULT;
  const { track } = useAnalytics();
  if (!banner.title && !banner.body) return null;

  return (
    <PageSection variant="bleed" padding="spacious" className="bg-secondary text-on-dark">
      <Container>
        <Stack gap={4} align="center" className="text-center">
          {banner.eyebrow && (
            <Text size="sm" tone="inverse" className="font-semibold uppercase tracking-[0.18em]">
              {banner.eyebrow}
            </Text>
          )}
          {banner.title && <Display size="lg">{banner.title}</Display>}
          {banner.body && (
            <Text tone="inverse" className="max-w-prose opacity-90">
              {banner.body}
            </Text>
          )}
          {banner.href && banner.cta && (
            <div className="pt-2">
              <Link
                href={banner.href}
                onClick={() =>
                  track('cta_click', {
                    id: 'promo-banner',
                    location: 'promo_banner',
                    href: banner.href ?? '',
                  })
                }
                {...(banner.href.startsWith('http')
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                <Button variant="primary" size="lg">
                  {banner.cta}
                </Button>
              </Link>
            </div>
          )}
        </Stack>
      </Container>
    </PageSection>
  );
}
