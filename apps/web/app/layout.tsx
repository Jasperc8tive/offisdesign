import type { Metadata } from 'next';
import { Frank_Ruhl_Libre, Koulen, Quicksand } from 'next/font/google';
import { Providers } from '../lib/providers';
import { JsonLd } from '../components/seo/json-ld';
import { websiteJsonLd } from '../components/seo/schemas';
import { apiConfig } from '../lib/api/config';
import '@offisdesign/ui/tokens.css';
import './globals.css';

const heading = Frank_Ruhl_Libre({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const display = Koulen({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
});

const body = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(apiConfig.webUrl),
  title: {
    default: 'Offisdesign — Furniture made to outlast trends',
    template: '%s — Offisdesign',
  },
  description: 'Solid timber, traceable supply chains, ten-year warranties. Built in Britain.',
  applicationName: 'Offisdesign',
  authors: [{ name: 'Offisdesign' }],
  robots: { index: true, follow: true },
  openGraph: { siteName: 'Offisdesign', locale: 'en_GB', type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${display.variable} ${body.variable}`}>
      <body className="bg-background text-text font-body antialiased">
        <JsonLd payload={websiteJsonLd()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
