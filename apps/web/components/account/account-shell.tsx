'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@offisdesign/utils';
import { useAuth } from '../../lib/providers';

const NAV: ReadonlyArray<{ href: string; label: string; exact?: boolean }> = [
  { href: '/account', label: 'Overview', exact: true },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/profile', label: 'Profile' },
  { href: '/account/password', label: 'Password' },
  { href: '/account/sessions', label: 'Sessions' },
];

/**
 * Shared chrome for the signed-in account area. A horizontal, scrollable nav on
 * mobile that becomes a sticky vertical sidebar from lg up. Pages keep their own
 * headings; this only provides navigation + the content column.
 */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { logout } = useAuth();

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const linkClass = (active: boolean) =>
    cn(
      'font-body text-body-sm duration-base ease-standard whitespace-nowrap rounded-sm px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      active
        ? 'bg-primary-subtle text-primary font-semibold'
        : 'text-secondary hover:bg-surface hover:text-primary',
    );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      <aside aria-label="Account" className="lg:sticky lg:top-24 lg:self-start">
        <nav className="border-border flex gap-1 overflow-x-auto border-b pb-2 lg:flex-col lg:border-b-0 lg:pb-0">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? 'page' : undefined}
              className={linkClass(isActive(item))}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => logout().then(() => router.replace('/'))}
            className="text-secondary hover:bg-surface hover:text-primary font-body text-body-sm duration-base ease-standard focus-visible:ring-primary inline-flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 lg:mt-2"
          >
            <LogOut width={15} height={15} aria-hidden />
            Sign out
          </button>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
