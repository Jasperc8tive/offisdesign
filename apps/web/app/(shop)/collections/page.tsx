import type { Metadata } from 'next';
import { CollectionsIndex } from '../../../components/listing/collections-index';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Browse Offisdesign collections — curated edits by room, material, and use.',
  alternates: { canonical: '/collections' },
  openGraph: {
    title: 'Collections — Offisdesign',
    description: 'Curated furniture edits by room, material, and use.',
    type: 'website',
  },
};

export default function CollectionsIndexPage() {
  return <CollectionsIndex />;
}
