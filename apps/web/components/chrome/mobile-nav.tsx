'use client';

import Link from 'next/link';
import { Cluster, NavLink, Stack, Text } from '@offisdesign/ui';
import { Drawer } from './drawer';
import { useNavigation } from '../../lib/hooks';
import { useAnalytics } from '../../lib/providers';

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

function isNavItem(v: unknown): v is NavItem {
  return typeof v === 'object' && v !== null && typeof (v as NavItem).label === 'string';
}

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useNavigation('header');
  const { track } = useAnalytics();
  const items = Array.isArray(data?.items) ? (data.items as unknown[]).filter(isNavItem) : [];

  return (
    <Drawer open={open} onClose={onClose} side="left" label="Mobile navigation" title="Menu">
      <Stack gap={1} className="p-4">
        {items.length === 0 ? (
          <Text tone="muted">Navigation is being prepared.</Text>
        ) : (
          items.map((item) => (
            <Stack gap={1} key={item.href}>
              <Link
                href={item.href}
                onClick={() => {
                  track('nav_clicked', { label: item.label, href: item.href, surface: 'mobile' });
                  onClose();
                }}
                className="font-body text-body text-secondary hover:bg-primary-subtle hover:text-primary block rounded-sm px-3 py-2 font-semibold transition-colors"
              >
                {item.label}
              </Link>
              {item.children && item.children.length > 0 && (
                <Cluster gap={2} wrap className="ml-3">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.href}
                      href={child.href}
                      onClick={() => {
                        track('nav_clicked', {
                          label: child.label,
                          href: child.href,
                          surface: 'mobile',
                        });
                        onClose();
                      }}
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </Cluster>
              )}
            </Stack>
          ))
        )}
      </Stack>
    </Drawer>
  );
}
