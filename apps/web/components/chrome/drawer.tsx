'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Icon } from '@offisdesign/ui';
import { cn } from '@offisdesign/utils';

/**
 * Generic side-drawer. Stage 9 introduces a single primitive here — every
 * navigation overlay (mobile menu, search, cart) reuses it so behaviour
 * (focus trap, backdrop, Esc to close, body-scroll lock) stays consistent.
 * No new design-system component required; the visuals are entirely Tailwind
 * tokens.
 */
export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right' | 'top';
  label: string;
  /** Optional title rendered in the header strip. */
  title?: React.ReactNode;
  children: React.ReactNode;
}

export function Drawer({ open, onClose, side = 'right', label, title, children }: DrawerProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const lastFocused = React.useRef<HTMLElement | null>(null);

  // Esc to close + body scroll lock + restore focus on close.
  React.useEffect(() => {
    if (!open) return;
    lastFocused.current = (document.activeElement as HTMLElement) ?? null;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Move focus into the dialog.
    requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const sideClasses =
    side === 'right'
      ? 'right-0 top-0 h-full w-full max-w-md border-l border-border'
      : side === 'left'
        ? 'left-0 top-0 h-full w-full max-w-md border-r border-border'
        : 'left-0 right-0 top-0 max-h-[80vh] border-b border-border';

  return (
    <div className="z-modal fixed inset-0" role="dialog" aria-modal="true" aria-label={label}>
      <div
        aria-hidden
        onClick={onClose}
        className="bg-secondary/40 absolute inset-0 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn('bg-background absolute flex flex-col shadow-lg outline-none', sideClasses)}
      >
        <div className="border-border flex items-center justify-between border-b p-4">
          <div className="font-display text-h4 text-secondary uppercase tracking-wide">{title}</div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:shadow-focus rounded-sm p-2 transition-colors focus-visible:outline-none"
          >
            <Icon icon={X} decorative />
          </button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
