'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search as SearchIcon, ShoppingBag, User } from 'lucide-react';
import { Cluster, Container, Icon, NavLink } from '@offisdesign/ui';
import { CartDrawer } from './cart-drawer';
import { MobileNav } from './mobile-nav';
import { SearchOverlay } from './search-overlay';
import { useNavigation } from '../../lib/hooks';
import { useAuth, useCart, useAnalytics } from '../../lib/providers';

interface NavItem {
  label: string;
  href: string;
}

function isNavItem(v: unknown): v is NavItem {
  return typeof v === 'object' && v !== null && typeof (v as NavItem).label === 'string';
}

function DesktopNav() {
  const { data } = useNavigation('header');
  const { track } = useAnalytics();
  const items = Array.isArray(data?.items)
    ? (data.items as unknown[]).filter(isNavItem)
    : [
        { label: 'Shop', href: '/search' },
        { label: 'Collections', href: '/collections' },
        { label: 'Journal', href: '/journal' },
        { label: 'About', href: '/about' },
      ];
  return (
    <nav aria-label="Primary" className="hidden md:block">
      <Cluster gap={8}>
        {items.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            onClick={() =>
              track('nav_clicked', { label: item.label, href: item.href, surface: 'header' })
            }
          >
            {item.label}
          </NavLink>
        ))}
      </Cluster>
    </nav>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const { track } = useAnalytics();

  return (
    <>
      <header className="z-sticky border-border bg-background/95 sticky top-0 border-b backdrop-blur">
        <Container className="flex items-center gap-4 py-4">
          <button
            type="button"
            className="text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:shadow-focus inline-flex h-10 w-10 items-center justify-center rounded-sm transition-colors focus-visible:outline-none md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Icon icon={Menu} decorative />
          </button>
          <Link
            href="/"
            className="font-display text-h4 text-secondary uppercase tracking-wide"
            onClick={() => track('nav_clicked', { label: 'Home', href: '/', surface: 'header' })}
          >
            Offisdesign
          </Link>
          <div className="flex-1">
            <DesktopNav />
          </div>
          <Cluster gap={1} align="center">
            <button
              type="button"
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
              className="text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:shadow-focus inline-flex h-10 w-10 items-center justify-center rounded-sm transition-colors focus-visible:outline-none"
            >
              <Icon icon={SearchIcon} decorative />
            </button>
            <Link
              href={isAuthenticated ? '/account' : '/account/login'}
              aria-label="Account"
              className="text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:shadow-focus inline-flex h-10 w-10 items-center justify-center rounded-sm transition-colors focus-visible:outline-none"
            >
              <Icon icon={User} decorative />
            </Link>
            <button
              type="button"
              aria-label={`Cart (${itemCount} items)`}
              onClick={() => {
                track('cart_opened', { trigger: 'header' });
                setCartOpen(true);
              }}
              className="text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:shadow-focus relative inline-flex h-10 w-10 items-center justify-center rounded-sm transition-colors focus-visible:outline-none"
            >
              <Icon icon={ShoppingBag} decorative />
              {itemCount > 0 && (
                <span
                  aria-hidden
                  className="bg-primary font-body text-caption text-on-dark absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-semibold"
                >
                  {itemCount}
                </span>
              )}
            </button>
          </Cluster>
        </Container>
      </header>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
