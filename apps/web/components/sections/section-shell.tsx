'use client';

import { Heading, Stack, Text } from '@offisdesign/ui';

/**
 * Visual rhythm for a homepage section: optional eyebrow, h2 title, optional
 * lead paragraph, and a slot for the section body. Keeps spacing consistent
 * without inventing a new design-system component.
 */
export function SectionShell({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined}>
      <Stack gap={4}>
        {(eyebrow || title || lead) && (
          <Stack gap={1}>
            {eyebrow && (
              <Text size="sm" tone="primary" className="uppercase tracking-wide">
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
        )}
        <div>{children}</div>
      </Stack>
    </section>
  );
}
