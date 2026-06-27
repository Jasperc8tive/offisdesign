'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

/**
 * Auto-derived breadcrumbs from the URL path. Each segment is title-cased
 * and links to its cumulative path. Routes that want a richer label
 * (e.g. resource name on a detail page) should render their own crumb
 * via a portal — Stage 14 candidate.
 */
export function Breadcrumbs() {
  const pathname = usePathname() ?? '/';
  if (pathname === '/') return null;
  const segments = pathname.split('/').filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="font-body text-body-sm">
      <ol className="text-muted flex items-center gap-1">
        <li>
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
        </li>
        {segments.map((seg, i) => {
          const href = '/' + segments.slice(0, i + 1).join('/');
          const isLast = i === segments.length - 1;
          const label = humanise(seg);
          return (
            <li key={href} className="flex items-center gap-1">
              <ChevronRight width={12} height={12} aria-hidden />
              {isLast ? (
                <span className="text-secondary" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link href={href} className="hover:text-primary">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function humanise(seg: string): string {
  if (seg.length <= 8 && seg.includes('-') === false && /^[0-9a-f]{8}/.test(seg)) return seg;
  return seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
