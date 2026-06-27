import type { Metadata } from 'next';
import '@offisdesign/ui/tokens.css';
import './globals.css';
import { Providers } from '../lib/providers';
import { AdminShell } from '../components/shell/admin-shell';

export const metadata: Metadata = {
  title: { default: 'Offisdesign Admin', template: '%s · Offisdesign Admin' },
  description: 'Internal operations console for Offisdesign.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-text font-body antialiased">
        <Providers>
          <AdminShell>{children}</AdminShell>
        </Providers>
      </body>
    </html>
  );
}
