'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '@offisdesign/ui';
import { useAnnouncements } from '../../lib/hooks';
import { useAnalytics } from '../../lib/providers';

const ROTATE_MS = 4000;

export function AnnouncementBar() {
  const { data } = useAnnouncements();
  const { track } = useAnalytics();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const announcements = data ?? [];
  const current = announcements.length > 0 ? announcements[idx % announcements.length] : undefined;

  useEffect(() => {
    if (announcements.length < 2 || paused) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % announcements.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [announcements.length, paused]);

  if (!current) return null;

  return (
    <div
      className="bg-secondary text-on-dark"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Container className="font-body text-body-sm flex items-center justify-center gap-3 py-2">
        <span>
          {current.href ? (
            <Link
              href={current.href}
              onClick={() =>
                track('cta_click', {
                  id: `announcement:${current.id}`,
                  location: 'announcement',
                  href: current.href ?? '',
                })
              }
              className="underline-offset-4 hover:underline"
            >
              {current.message}
            </Link>
          ) : (
            current.message
          )}
        </span>

        {announcements.length > 1 && (
          <span aria-hidden className="flex items-center gap-1">
            {announcements.map((_, i) => (
              <span
                key={i}
                className={
                  i === idx % announcements.length
                    ? 'duration-base h-1 w-3 rounded-full bg-white transition-all'
                    : 'duration-base h-1 w-1 rounded-full bg-white/40 transition-all'
                }
              />
            ))}
          </span>
        )}
      </Container>
    </div>
  );
}
