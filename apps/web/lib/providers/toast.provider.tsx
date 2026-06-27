'use client';

import { Toaster } from 'sonner';

/**
 * Toast surface. Lives at the root so any client component can call
 * `toast(...)` from `sonner` without further wiring. Styling is plain — the
 * design system's brand colours are picked up via CSS variables.
 */
export function ToastProvider() {
  return <Toaster position="top-right" closeButton richColors />;
}

export { toast } from 'sonner';
