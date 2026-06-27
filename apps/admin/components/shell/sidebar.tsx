'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Boxes,
  FileText,
  Flag,
  LayoutDashboard,
  ListChecks,
  Package,
  Settings,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { cn } from '@offisdesign/utils';
import { useAuth } from '../../lib/providers';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Permission scopes — any match is sufficient. `*` is always granted. */
  any: string[];
}

const NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, any: ['*'] },
  { href: '/catalog/products', label: 'Products', icon: Package, any: ['catalog:read'] },
  { href: '/orders', label: 'Orders', icon: ShoppingBag, any: ['orders:read'] },
  { href: '/customers', label: 'Customers', icon: Users, any: ['customers:read'] },
  { href: '/cms/pages', label: 'CMS', icon: BookOpen, any: ['cms:read'] },
  { href: '/media', label: 'Media', icon: FileText, any: ['cms:read', 'catalog:read'] },
  { href: '/operations/flags', label: 'Feature flags', icon: Flag, any: ['system:flags'] },
  { href: '/operations/queues', label: 'Queues', icon: Boxes, any: ['system:audit'] },
  { href: '/operations/audit', label: 'Audit log', icon: ListChecks, any: ['system:audit'] },
  { href: '/operations/notifications', label: 'Notifications', icon: Bell, any: ['system:audit'] },
  { href: '/settings', label: 'Settings', icon: Settings, any: ['system:settings'] },
];

export function Sidebar() {
  const pathname = usePathname() ?? '/';
  const { can } = useAuth();
  const visible = NAV.filter((item) => can(...item.any));
  return (
    <nav
      aria-label="Admin"
      className="bg-canvas border-default flex h-full w-60 shrink-0 flex-col border-r"
    >
      <div className="border-default border-b px-5 py-4">
        <span className="font-heading text-secondary text-xl">Offisdesign</span>
        <div className="text-caption text-muted mt-1">Admin</div>
      </div>
      <ul className="flex-1 overflow-y-auto px-2 py-3">
        {visible.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'font-body text-body-sm flex items-center gap-3 rounded-sm px-3 py-2 transition-colors',
                  active
                    ? 'bg-primary-subtle text-primary font-semibold'
                    : 'text-secondary hover:bg-primary-subtle/60',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon width={16} height={16} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
