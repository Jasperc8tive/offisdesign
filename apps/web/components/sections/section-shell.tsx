'use client';

import { Heading, Stack, Text } from '@offisdesign/ui';
import { cn } from '@offisdesign/utils';

type Space = 'compact' | 'default' | 'spacious';

const spaceMap: Record<Space, string> = {
  compact: 'py-8 md:py-10',
  default: 'py-10 md:py-14',
  spacious: 'py-16 md:py-24',
};

/**
 * Canonical contained homepage section. Owns its vertical rhythm (so the page
 * no longer needs one uniform Stack gap) and renders the editorial section
 * header — a crimson eyebrow, a serif h2, and an optional lead — with an
 * optional right-aligned action (e.g. a "See all" link). Does NOT add its own
 * Container: the shop layout already constrains width to 1120px.
 */
export function SectionShell({
  id,
  eyebrow,
  title,
  lead,
  action,
  align = 'start',
  space = 'default',
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  lead?: string;
  action?: React.ReactNode;
  align?: 'start' | 'center';
  space?: Space;
  children: React.ReactNode;
}) {
  const centered = align === 'center';
  const hasHeader = Boolean(eyebrow || title || lead || action);

  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className={cn(spaceMap[space])}>
      <Stack gap={8}>
        {hasHeader && (
          <div
            className={cn(
              'flex flex-col gap-4',
              centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between',
            )}
          >
            <Stack gap={2} className={cn('max-w-2xl', centered && 'items-center')}>
              {eyebrow && (
                <Text
                  size="sm"
                  tone="primary"
                  className="font-semibold uppercase tracking-[0.18em]"
                >
                  {eyebrow}
                </Text>
              )}
              {title && (
                <Heading level={2} id={id ? `${id}-h` : undefined}>
                  {title}
                </Heading>
              )}
              {lead && (
                <Text tone="muted" className="max-w-prose">
                  {lead}
                </Text>
              )}
            </Stack>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        <div>{children}</div>
      </Stack>
    </section>
  );
}
