import Link from 'next/link';
import { Container, Stack, Heading, Text, Divider } from '@offisdesign/ui';

const sections = [
  {
    label: 'Design system',
    items: [
      { href: '/design', label: 'Index' },
      { href: '/design/components', label: 'UI Showcase' },
    ],
  },
  {
    label: 'Prototypes',
    items: [
      { href: '/design/home', label: 'Homepage' },
      { href: '/design/collection', label: 'Collection Listing' },
      { href: '/design/product', label: 'Product Detail' },
      { href: '/design/cart', label: 'Cart Drawer' },
      { href: '/design/checkout', label: 'Checkout' },
      { href: '/design/account', label: 'Account Dashboard' },
      { href: '/design/cms', label: 'CMS Content Page' },
      { href: '/design/blog', label: 'Blog Article' },
    ],
  },
];

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="focus:z-tooltip focus:bg-primary focus:font-body focus:text-on-dark focus:shadow-focus sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-sm focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <header className="z-sticky border-border bg-background/95 sticky top-0 border-b backdrop-blur">
        <Container className="flex items-center justify-between py-4">
          <Link
            href="/design"
            className="font-display text-h4 text-secondary uppercase tracking-wide"
          >
            Offisdesign · Design
          </Link>
          <Text size="sm" tone="muted">
            Validation environment — not production
          </Text>
        </Container>
      </header>
      <Container className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Stack gap={8}>
            {sections.map((section) => (
              <Stack gap={2} key={section.label}>
                <Heading level={4} className="text-h4">
                  {section.label}
                </Heading>
                <Divider />
                <Stack gap={1} as="ul">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="font-body text-body-sm text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:ring-primary block rounded-sm px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </aside>
        <main id="main" className="min-w-0">
          {children}
        </main>
      </Container>
    </div>
  );
}
