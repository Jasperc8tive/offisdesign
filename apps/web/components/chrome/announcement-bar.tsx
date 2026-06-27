'use client';

import Link from 'next/link';
import { Container } from '@offisdesign/ui';
import { useAnnouncements } from '../../lib/hooks';
import { useAnalytics } from '../../lib/providers';

/**
 * Top-of-page promo. Pulls live announcements from CMS and gracefully
 * disappears when there are none.
 */
export function AnnouncementBar() {
  const { data } = useAnnouncements();
  const { track } = useAnalytics();
  const first = data?.[0];
  if (!first) return null;
  return (
    <div className="bg-secondary text-on-dark" role="status">
      <Container className="font-body text-body-sm py-2 text-center">
        {first.href ? (
          <Link
            href={first.href}
            onClick={() =>
              track('cta_click', {
                id: `announcement:${first.id}`,
                location: 'announcement',
                href: first.href ?? '',
              })
            }
            className="underline-offset-4 hover:underline"
          >
            {first.message}
          </Link>
        ) : (
          first.message
        )}
      </Container>
    </div>
  );
}
