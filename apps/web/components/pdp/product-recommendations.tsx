'use client';

import { Heading, Stack } from '@offisdesign/ui';
import { ProductGrid } from '../listing/product-grid';
import type { Product } from '../../lib/api/schemas';

type LinkKind = 'RELATED' | 'CROSS_SELL' | 'UP_SELL';

interface Props {
  title: string;
  /** Which curated link kinds to include — merged and de-duplicated. */
  kinds: LinkKind[];
  links: Product['linksFrom'];
  location: string;
  max?: number;
}

/**
 * Renders admin-curated cross/up/related links attached to a product
 * (`ProductLink`). The PDP merges all curated kinds into a single strip so the
 * page shows one focused "pairs well with" row instead of three near-identical
 * grids. Hidden when no links match.
 */
export function ProductRecommendations({ title, kinds, links, location, max = 4 }: Props) {
  const seen = new Set<string>();
  const items = links
    .filter((l) => kinds.includes(l.kind))
    .sort((a, b) => a.position - b.position)
    .map((l) => {
      const variant = l.to.variants[0];
      return {
        id: l.to.id,
        slug: l.to.slug,
        name: l.to.name,
        fromAmount: variant?.priceAmount ?? null,
        currency: variant?.priceCurrency ?? 'NGN',
        ...(variant?.compareAtAmount ? { compareAtAmount: variant.compareAtAmount } : {}),
      };
    })
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .slice(0, max);

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
