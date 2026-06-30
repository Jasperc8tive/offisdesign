'use client';

import Link from 'next/link';

/**
 * Centered shell for the unauthenticated account pages (login, register, reset,
 * verify). Adds the brand wordmark above the page's own form so these screens
 * read as a focused, branded moment rather than a bare form.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md py-6 md:py-10">
      <div className="mb-8 text-center">
        <Link href="/" className="font-display text-h3 text-secondary uppercase tracking-[0.12em]">
          Offisdesign
        </Link>
      </div>
      {children}
    </div>
  );
}
