'use client';

import { Stack, Heading } from '@offisdesign/ui';
import { useProducts } from '../../lib/hooks';
import { ProductGrid } from '../listing/product-grid';

interface Props {
  title: string;
  collection?: string;
  /** When set, excludes the focal product from the related list. */
  excludeProductId?: string;
}

/**
 * "You may also like" strip. Pulls recent products from the same collection
 * when available — otherwise the most recent four overall.
 */
export function RelatedProducts({ title, collection, excludeProductId }: Props) {
  const { data, isLoading, isError } = useProducts({
    pageSize: 8,
    sort: 'recent',
    ...(collection ? { collection } : {}),
  });

  const products = data?.data
    .filter((p) => p.id !== excludeProductId)
    .slice(0, 4)
    .map((p) => {
      const variant = p.variants[0];
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        fromAmount: variant?.priceAmount ?? null,
        currency: variant?.priceCurrency ?? 'GBP',
        mediaId: p.media[0]?.mediaId ?? null,
        ...(variant?.compareAtAmount ? { compareAtAmount: variant.compareAtAmount } : {}),
      };
    });

  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <Stack gap={4}>
      <Heading level={2}>{title}</Heading>
      <ProductGrid
        isLoading={isLoading}
        isError={isError}
        products={products}
        cols={4}
        location="pdp_related"
        skeletonCount={4}
      />
    </Stack>
  );
}
