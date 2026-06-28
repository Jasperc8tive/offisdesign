import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Queues' };

export default function QueuesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
