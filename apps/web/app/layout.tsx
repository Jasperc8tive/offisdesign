import type { Metadata } from 'next';
import { Frank_Ruhl_Libre, Koulen, DM_Sans } from 'next/font/google';
import { Providers } from '../lib/providers';
import { JsonLd } from '../components/seo/json-ld';
import { websiteJsonLd } from '../components/seo/schemas';
import { WebVitals } from '../components/observability/web-vitals';
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

const body = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(apiConfig.webUrl),
  title: {
    default: 'OFFISDESIGN — Office Furniture & Workspace Solutions in Lagos, Nigeria',
    template: '%s — OFFISDESIGN',
  },
  description:
    'Premium office furniture and workspace solutions in Lagos, Nigeria — executive desks, ergonomic chairs, workstations, and complete office fit-out, designed for productivity.',
  applicationName: 'OFFISDESIGN',
  authors: [{ name: 'OFFISDESIGN' }],
  robots: { index: true, follow: true },
  openGraph: { siteName: 'OFFISDESIGN', locale: 'en_NG', type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${display.variable} ${body.variable}`}>
      <body className="bg-background text-text font-body antialiased">
        <JsonLd payload={websiteJsonLd()} />
        <WebVitals />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
