'use client';

import { Ruler, ShieldCheck, Truck } from 'lucide-react';
import { Icon, Stack, Text } from '@offisdesign/ui';

const PROMISES = [
  {
    icon: Ruler,
    title: 'Workspace consultation',
    body: 'Space planning and layout, tailored to how you work.',
  },
  {
    icon: Truck,
    title: 'Delivery & installation',
    body: 'Professional fit-out and setup across Nigeria.',
  },
  {
    icon: ShieldCheck,
    title: 'Warranty & support',
    body: 'Quality-built and backed by attentive after-sales care.',
  },
];

/**
 * Quiet reassurance strip — a single hairline-bordered band with the three
 * brand promises divided by thin rules. Deliberately card-free so it reads as
 * a calm signal, not a row of boxes.
 */
export function TrustIndicators() {
  return (
    <section className="border-border border-y py-8 md:py-10">
      <div className="sm:divide-border grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x">
        {PROMISES.map((p) => (
          <div key={p.title} className="flex items-start gap-3 sm:justify-center sm:px-6">
            <Icon icon={p.icon} size="md" decorative className="text-primary mt-0.5 shrink-0" />
            <Stack gap={0}>
              <Text weight="semibold" className="text-secondary">
                {p.title}
              </Text>
              <Text size="sm" tone="muted">
                {p.body}
              </Text>
            </Stack>
          </div>
        ))}
      </div>
    </section>
  );
}
