'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container } from '@offisdesign/ui';
import { Media } from '../media/media';

export interface MegaMenuFeatured {
  eyebrow?: string;
  title: string;
  lead?: string;
  href: string;
  cta: string;
  imageSrc?: string;
  imageAlt?: string;
}

interface Props {
  label: string;
  items: Array<{ label: string; href: string }>;
  featured?: MegaMenuFeatured;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const PANEL_CLASS =
  'border-border bg-background absolute left-0 right-0 top-full border-b shadow-xl';

export function MegaMenu({ label, items, featured, onClose, onMouseEnter, onMouseLeave }: Props) {
  return (
    <div
      className={`${PANEL_CLASS} animate-mega-in`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Container className="py-8">
        {featured ? (
          <div className="flex gap-12">
            {/* Nav links column */}
            <div className="w-44 shrink-0">
              <p className="text-muted font-body text-caption mb-5 uppercase tracking-widest">
                {label}
              </p>
              <nav aria-label={`${label} links`}>
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="text-secondary hover:text-primary hover:bg-primary-subtle font-body text-body-sm duration-fast ease-standard focus-visible:ring-primary block rounded-sm px-2 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Featured callout — image slot ready for CMS photography */}
            <div className="flex flex-1 items-start gap-8 pt-1">
              <div className="bg-surface relative h-44 w-56 shrink-0 overflow-hidden rounded-md">
                {featured.imageSrc && (
                  <Media src={featured.imageSrc} alt={featured.imageAlt ?? ''} sizes="224px" />
                )}
              </div>
              <div className="space-y-3">
                {featured.eyebrow && (
                  <p className="text-muted font-body text-caption uppercase tracking-widest">
                    {featured.eyebrow}
                  </p>
                )}
                <p className="font-heading text-secondary text-h3">{featured.title}</p>
                {featured.lead && (
                  <p className="text-muted font-body text-body-sm max-w-[28ch]">{featured.lead}</p>
                )}
                <Link
                  href={featured.href}
                  onClick={onClose}
                  {...(featured.href.startsWith('http')
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="text-primary font-body text-body-sm focus-visible:ring-primary inline-flex items-center gap-1.5 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2"
                >
                  {featured.cta}
                  <ArrowRight width={13} height={13} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-muted font-body text-caption mb-5 uppercase tracking-widest">
              {label}
            </p>
            <div className="grid grid-cols-3 gap-x-12 gap-y-0.5">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="text-secondary hover:text-primary hover:bg-primary-subtle font-body text-body-sm duration-fast ease-standard focus-visible:ring-primary block rounded-sm px-2 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
