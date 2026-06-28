import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'CMS pages' };

export default function CmsPagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
