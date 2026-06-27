'use client';

import Link from 'next/link';
import { Container, Grid, Heading, Stack, Text } from '@offisdesign/ui';
import { useNavigation } from '../../lib/hooks';
import { useAnalytics } from '../../lib/providers';

interface NavGroup {
  label: string;
  children?: Array<{ label: string; href: string }>;
}

function isNavGroup(v: unknown): v is NavGroup {
  return typeof v === 'object' && v !== null && typeof (v as NavGroup).label === 'string';
}

export function Footer() {
  const { data } = useNavigation('footer');
  const { track } = useAnalytics();
  const groups = Array.isArray(data?.items) ? (data.items as unknown[]).filter(isNavGroup) : [];

  return (
    <footer className="border-border bg-background mt-16 border-t">
      <Container className="py-12">
        <Grid cols={4} gap={6}>
          {groups.length === 0 ? (
            <Stack gap={2} className="md:col-span-4">
              <Text size="sm" tone="muted">
                © {new Date().getFullYear()} Offisdesign
              </Text>
              <Text size="sm" tone="muted">
                Built in Britain. Furniture made to outlast trends.
              </Text>
            </Stack>
          ) : (
            groups.map((group) => (
              <Stack gap={2} key={group.label}>
                <Heading level={4}>{group.label}</Heading>
                <Stack gap={1} as="ul">
                  {(group.children ?? []).map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={() =>
                          track('nav_clicked', {
                            label: child.label,
                            href: child.href,
                            surface: 'footer',
                          })
                        }
                        className="font-body text-body-sm text-secondary hover:text-primary block rounded-sm px-1 py-0.5 transition-colors focus-visible:underline focus-visible:outline-none"
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </Stack>
              </Stack>
            ))
          )}
        </Grid>
      </Container>
      <div className="border-border border-t">
        <Container className="py-4 text-center">
          <Text size="caption" tone="muted">
            © {new Date().getFullYear()} Offisdesign · Built in Britain
          </Text>
        </Container>
      </div>
    </footer>
  );
}
