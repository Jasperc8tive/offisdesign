import Link from 'next/link';
import { Heading, Text, Stack, Grid, Card, CardHeader, CardBody, Badge } from '@offisdesign/ui';

const tiles = [
  {
    href: '/design/components',
    label: 'UI Showcase',
    desc: 'Every reusable component in one place.',
  },
  { href: '/design/home', label: 'Homepage', desc: 'Hero, featured collections, brand promises.' },
  {
    href: '/design/collection',
    label: 'Collection Listing',
    desc: 'Filters, sort, product grid, pagination.',
  },
  {
    href: '/design/product',
    label: 'Product Detail',
    desc: 'Gallery, options, price, tabs, related.',
  },
  { href: '/design/cart', label: 'Cart Drawer', desc: 'Line items, totals, checkout CTA.' },
  { href: '/design/checkout', label: 'Checkout', desc: 'Shipping, payment, order summary.' },
  { href: '/design/account', label: 'Account Dashboard', desc: 'Orders, addresses, preferences.' },
  { href: '/design/cms', label: 'CMS Content Page', desc: 'Long-form editorial layout.' },
  { href: '/design/blog', label: 'Blog Article', desc: 'Journal post with author + related.' },
];

export default function DesignIndex() {
  return (
    <Stack gap={8}>
      <Stack gap={3}>
        <Badge variant="muted">Stage 3.6</Badge>
        <Heading level={1}>UX Validation & Design System Integration</Heading>
        <Text tone="muted">
          A living prototype to validate that every token, primitive, and component composes into
          coherent, accessible, responsive layouts before any real backend or business logic.
        </Text>
      </Stack>
      <Grid cols={3} gap={4}>
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="focus-visible:shadow-focus rounded-md focus-visible:outline-none"
          >
            <Card interactive className="h-full">
              <CardHeader>
                <Heading level={4}>{t.label}</Heading>
                <Text size="sm" tone="muted">
                  {t.desc}
                </Text>
              </CardHeader>
              <CardBody>
                <Text size="sm" tone="primary">
                  Open →
                </Text>
              </CardBody>
            </Card>
          </Link>
        ))}
      </Grid>
    </Stack>
  );
}
