'use client';

import { Heading, Stack } from '@offisdesign/ui';
import { ProductGrid } from '../listing/product-grid';
import type { Product } from '../../lib/api/schemas';

interface Props {
  title: string;
  kind: 'RELATED' | 'CROSS_SELL' | 'UP_SELL';
  links: Product['linksFrom'];
  location: string;
}

/**
 * Renders the admin-curated cross/up/related links attached to a product
 * (`ProductLink`). Hidden when no links of the given kind exist so each
 * section disappears cleanly rather than rendering an empty heading.
 */
export function ProductRecommendations({ title, kind, links, location }: Props) {
  const items = links
    .filter((l) => l.kind === kind)
    .sort((a, b) => a.position - b.position)
    .map((l) => {
      const variant = l.to.variants[0];
      return {
        id: l.to.id,
        slug: l.to.slug,
        name: l.to.name,
        fromAmount: variant?.priceAmount ?? null,
        currency: variant?.priceCurrency ?? 'GBP',
        ...(variant?.compareAtAmount ? { compareAtAmount: variant.compareAtAmount } : {}),
      };
    });

  if (items.length === 0) return null;

  return (
    <Stack gap={4}>
      <Heading level={2}>{title}</Heading>
      <ProductGrid
        isLoading={false}
        isError={false}
        products={items}
        cols={4}
        location={location}
      />
    </Stack>
  );
}
