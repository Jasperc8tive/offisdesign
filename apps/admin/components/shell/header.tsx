'use client';

import { useRouter } from 'next/navigation';
import { Bell, LogOut, Search } from 'lucide-react';
import { Avatar, Button, Cluster, Stack, Text } from '@offisdesign/ui';
import { useAuth } from '../../lib/providers';
import { Breadcrumbs } from './breadcrumbs';

interface Props {
  onOpenPalette: () => void;
}

export function Header({ onOpenPalette }: Props) {
  const router = useRouter();
  const { principal, logout } = useAuth();
  const initials = principal?.id ? principal.id.slice(0, 2).toUpperCase() : 'OD';
  return (
    <header className="bg-canvas border-default flex items-center gap-4 border-b px-6 py-3">
      <Breadcrumbs />
      <div className="ml-auto">
        <Cluster gap={2} align="center">
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Open command palette"
            className="border-default text-muted hover:bg-primary-subtle/60 inline-flex items-center gap-2 rounded-sm border px-2 py-1 text-sm"
          >
            <Search width={14} height={14} aria-hidden />
            <span>Search…</span>
            <kbd className="text-caption text-muted">⌘K</kbd>
          </button>
          <Button variant="ghost" size="sm" aria-label="Notifications">
            <Bell width={16} height={16} aria-hidden />
          </Button>
          <Cluster gap={2} align="center">
            <Avatar initials={initials} size="sm" alt="Admin" />
            <Stack gap={0} className="hidden sm:flex">
              <Text size="sm" className="font-semibold">
                {principal?.kind === 'admin' ? 'Staff' : '—'}
              </Text>
              <Text size="sm" tone="muted">
                {principal?.roles.join(', ') || 'No roles'}
              </Text>
            </Stack>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout().then(() => router.replace('/login'))}
              aria-label="Sign out"
            >
              <LogOut width={16} height={16} aria-hidden />
            </Button>
          </Cluster>
        </Cluster>
      </div>
    </header>
  );
}
