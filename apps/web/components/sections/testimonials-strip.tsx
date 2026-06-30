'use client';

import { Text } from '@offisdesign/ui';
import { useTestimonials } from '../../lib/hooks';
import { SectionShell } from './section-shell';

export function TestimonialsStrip() {
  const { data, isLoading } = useTestimonials();
  if (isLoading) return null;
  if (!data || data.length === 0) return null;

  return (
    <SectionShell id="testimonials" eyebrow="From customers" title="What people say.">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
        {data.slice(0, 3).map((t) => (
          <figure key={t.id} className="border-border border-t pt-5">
            <span aria-hidden className="font-heading text-primary text-h2 block leading-none">
              &ldquo;
            </span>
            <blockquote className="-mt-2">
              <Text className="font-heading text-h4 text-secondary">{t.quote}</Text>
            </blockquote>
            <figcaption className="mt-4">
              <Text size="sm" tone="muted">
                {t.author}
                {t.source ? `, ${t.source}` : ''}
              </Text>
            </figcaption>
          </figure>
        ))}
      </div>
    </SectionShell>
  );
}
