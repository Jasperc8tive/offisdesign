'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { CommandPalette } from './command-palette';
import { useAuth } from '../../lib/providers';

/**
 * Authenticated admin shell. Unauthenticated visitors are redirected to
 * `/login?next=…`. The shell renders sidebar + header + main and mounts
 * the global command palette.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const { isAuthenticated, isLoading } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/login') {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (pathname === '/login') return <>{children}</>;
  if (isLoading || !isAuthenticated) return null;

  return (
    <div className="bg-background flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenPalette={() => setPaletteOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6" id="main">
          {children}
        </main>
      </div>
      {/* Command palette manages its own visibility via ⌘K; explicit open
          state lets the header button trigger it too. */}
      {paletteOpen && <ForcedOpenPalette onClose={() => setPaletteOpen(false)} />}
      <CommandPalette />
    </div>
  );
}

function ForcedOpenPalette({ onClose }: { onClose: () => void }) {
  // Dispatch a synthetic ⌘K so the palette mounts itself. Cheap, avoids
  // hoisting state we don't otherwise need.
  useEffect(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    onClose();
  }, [onClose]);
  return null;
}
