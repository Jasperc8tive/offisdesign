import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Feature flags' };

export default function FlagsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
