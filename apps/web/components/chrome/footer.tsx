'use client';

import Link from 'next/link';
import { Cluster, Container, Grid, Heading, Stack, Text } from '@offisdesign/ui';
import { useNavigation } from '../../lib/hooks';
import { BRAND_CONTACT } from '../../lib/brand/contact';
import { useAnalytics } from '../../lib/providers';

interface NavGroup {
  label: string;
  children?: Array<{ label: string; href: string }>;
}

function isNavGroup(v: unknown): v is NavGroup {
  return typeof v === 'object' && v !== null && typeof (v as NavGroup).label === 'string';
}

const PAYMENT_METHODS = ['Visa', 'Mastercard', 'Verve', 'Bank transfer'] as const;

export function Footer() {
  const { data } = useNavigation('footer');
  const { track } = useAnalytics();
  const groups = Array.isArray(data?.items) ? (data.items as unknown[]).filter(isNavGroup) : [];

  return (
    <footer className="border-border bg-background mt-16 border-t">
      {/* Brand statement */}
      <Container className="py-12 md:py-16">
        <div className="max-w-md space-y-3">
          <p className="font-display text-h3 text-secondary uppercase tracking-[0.12em]">
            Offisdesign
          </p>
          <Heading level={4}>Lagos&rsquo;s premium office workspace brand.</Heading>
          <Text tone="muted">
            Premium office furniture, workspace planning, and interior fit-out — designed for
            productivity and built for durability.
          </Text>
          <Stack gap={2} className="pt-2">
            <Text size="sm" tone="muted">
              {BRAND_CONTACT.address}
            </Text>
            <Cluster gap={4} align="center">
              <a
                href={BRAND_CONTACT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-body-sm text-primary rounded-sm underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
              >
                WhatsApp {BRAND_CONTACT.whatsappDisplay}
              </a>
              <a
                href={BRAND_CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-body-sm text-primary rounded-sm underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
              >
                Instagram {BRAND_CONTACT.instagramHandle}
              </a>
            </Cluster>
          </Stack>
        </div>
      </Container>

      {/* Nav columns — only when CMS provides groups */}
      {groups.length > 0 && (
        <div className="border-border border-t">
          <Container className="py-10">
            <Grid cols={4} gap={6}>
              {groups.map((group) => (
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
              ))}
            </Grid>
          </Container>
        </div>
      )}

      {/* Bottom bar */}
      <div className="border-border border-t">
        <Container className="py-4">
          <Cluster justify="between" align="center" wrap>
            <Text size="caption" tone="muted">
              © {new Date().getFullYear()} OFFISDESIGN · Lagos, Nigeria
            </Text>
            <Cluster gap={2} align="center">
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className="border-border font-body text-caption text-muted rounded-sm border px-1.5 py-0.5"
                >
                  {method}
                </span>
              ))}
            </Cluster>
          </Cluster>
        </Container>
      </div>
    </footer>
  );
}
