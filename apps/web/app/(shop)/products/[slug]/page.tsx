import type { Metadata } from 'next';
import { catalogService } from '../../../../lib/api/services';
import { apiConfig } from '../../../../lib/api/config';
import { ProductDetail } from './product-detail';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Per-product SEO. `generateMetadata` runs server-side, so it benefits from
 * the route's Next.js fetch cache without us touching the React Query cache.
 * Falls back to the brand default if the API call fails (e.g. during build).
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await catalogService.product(slug);
    const variant = product.variants[0];
    const description =
      product.description ?? 'Furniture made to outlast trends, built in Britain.';
    const ogImage = `${apiConfig.webUrl.replace(/\/$/, '')}/og/product/${encodeURIComponent(slug)}`;
    const title = product.name;
    return {
      title,
      description,
      alternates: { canonical: `/products/${product.slug}` },
      openGraph: {
        type: 'website',
        title,
        description,
        url: `/products/${product.slug}`,
        images: [{ url: ogImage, width: 1200, height: 630, alt: product.name }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
      other: variant
        ? {
            'product:price:amount': String((variant.priceAmount / 100).toFixed(2)),
            'product:price:currency': variant.priceCurrency,
          }
        : {},
    };
  } catch {
    return { title: 'Product — Offisdesign' };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}
