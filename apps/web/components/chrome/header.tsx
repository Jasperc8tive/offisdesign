'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronDown, Menu, Search as SearchIcon, ShoppingBag, User } from 'lucide-react';
import { Cluster, Container, Icon, NavLink } from '@offisdesign/ui';
import { cn } from '@offisdesign/utils';
import { MegaMenu, type MegaMenuFeatured } from './mega-menu';
import { useNavigation } from '../../lib/hooks';
import { useAnalytics, useAuth, useCart } from '../../lib/providers';

// Overlays are only needed on interaction, so they're code-split and mounted on
// open — keeping their JS out of every page's initial bundle.
const CartDrawer = dynamic(() => import('./cart-drawer').then((m) => m.CartDrawer), { ssr: false });
const MobileNav = dynamic(() => import('./mobile-nav').then((m) => m.MobileNav), { ssr: false });
const SearchOverlay = dynamic(() => import('./search-overlay').then((m) => m.SearchOverlay), {
  ssr: false,
});

interface NavItem {
  label: string;
  href: string;
  children?: Array<{ label: string; href: string }>;
  featured?: MegaMenuFeatured;
}

function isNavItem(v: unknown): v is NavItem {
  return typeof v === 'object' && v !== null && typeof (v as NavItem).label === 'string';
}

const CLOSE_DELAY_MS = 120;

function DesktopNav({
  activeMegaLabel,
  onOpen,
  onScheduleClose,
  onCancelClose,
}: {
  activeMegaLabel: string | null;
  onOpen: (item: NavItem) => void;
  onScheduleClose: () => void;
  onCancelClose: () => void;
}) {
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
        {items.map((item) => {
          const hasMega = Boolean(item.children?.length);
          const isActive = activeMegaLabel === item.label;

          if (hasMega) {
            return (
              <button
                key={item.label}
                type="button"
                aria-expanded={isActive}
                aria-haspopup="menu"
                onMouseEnter={() => {
                  onCancelClose();
                  onOpen(item);
                }}
                onMouseLeave={onScheduleClose}
                onClick={() => (isActive ? onScheduleClose() : onOpen(item))}
                className={cn(
                  'font-body text-body-sm duration-base ease-standard relative inline-flex cursor-pointer items-center gap-1 font-semibold uppercase tracking-wide transition-colors',
                  isActive ? 'text-primary' : 'text-secondary hover:text-primary',
                  'after:bg-primary after:duration-base after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:transition-transform',
                  isActive ? 'after:scale-x-100' : 'hover:after:scale-x-100',
                  'focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-2',
                )}
              >
                {item.label}
                <ChevronDown
                  width={11}
                  height={11}
                  aria-hidden
                  className={cn(
                    'duration-base ease-standard transition-transform',
                    isActive && 'rotate-180',
                  )}
                />
              </button>
            );
          }

          return (
            <NavLink
              key={item.href}
              href={item.href}
              onMouseEnter={onScheduleClose}
              onClick={() => {
                track('nav_clicked', { label: item.label, href: item.href, surface: 'header' });
                onScheduleClose();
              }}
            >
              {item.label}
            </NavLink>
          );
        })}
      </Cluster>
    </nav>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeMega, setActiveMega] = useState<NavItem | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const { track } = useAnalytics();

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveMega(null), CLOSE_DELAY_MS);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const openMega = useCallback(
    (item: NavItem) => {
      cancelClose();
      setActiveMega(item);
    },
    [cancelClose],
  );

  useEffect(() => {
    if (!activeMega) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMega(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeMega]);

  return (
    <>
      <header className="z-sticky border-border bg-background/95 relative sticky top-0 border-b backdrop-blur">
        <Container className="flex items-center gap-6 py-5">
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
            className="font-display text-h3 text-secondary shrink-0 uppercase tracking-[0.12em]"
            onClick={() => {
              track('nav_clicked', { label: 'Home', href: '/', surface: 'header' });
              setActiveMega(null);
            }}
          >
            Offisdesign
          </Link>

          <div className="flex-1">
            <DesktopNav
              activeMegaLabel={activeMega?.label ?? null}
              onOpen={openMega}
              onScheduleClose={scheduleClose}
              onCancelClose={cancelClose}
            />
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

        {activeMega && activeMega.children && activeMega.children.length > 0 && (
          <MegaMenu
            label={activeMega.label}
            items={activeMega.children}
            {...(activeMega.featured !== undefined && { featured: activeMega.featured })}
            onClose={() => setActiveMega(null)}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          />
        )}
      </header>

      {activeMega && (
        <div
          aria-hidden
          className="z-dropdown bg-secondary/10 fixed inset-0 cursor-default"
          onClick={() => setActiveMega(null)}
        />
      )}

      {mobileOpen && <MobileNav open onClose={() => setMobileOpen(false)} />}
      {searchOpen && <SearchOverlay open onClose={() => setSearchOpen(false)} />}
      {cartOpen && <CartDrawer open onClose={() => setCartOpen(false)} />}
    </>
  );
}
