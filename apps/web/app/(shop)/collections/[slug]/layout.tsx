import type { Metadata } from 'next';
import { catalogService } from '../../../../lib/api/services/catalog';
import { apiConfig } from '../../../../lib/api/config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const collection = await catalogService.collection(slug);
    const url = `${apiConfig.webUrl}/collections/${slug}`;
    const title = collection.name;
    const description = collection.description ?? `Browse ${collection.name} on Offisdesign.`;
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch {
    // Collection not found / API down — fall back to default site metadata.
    return {};
  }
}

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
