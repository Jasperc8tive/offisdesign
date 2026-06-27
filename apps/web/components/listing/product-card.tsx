'use client';

import Link from 'next/link';
import { AspectRatio, Card, CardBody, PriceTag, Stack, Text } from '@offisdesign/ui';
import { useAnalytics } from '../../lib/providers';

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  fromAmount: number | null;
  currency: string;
  compareAtAmount?: number | null;
}

interface Props {
  product: ProductCardData;
  location: string;
}

/**
 * The atomic product card used across home, collections, search, and
 * recommendations. Wraps the design-system `Card` + `PriceTag` + image
 * placeholder so call sites stay terse and consistent.
 */
export function ProductCard({ product, location }: Props) {
  const { track } = useAnalytics();
  return (
    <Link
      href={`/products/${product.slug}`}
      onClick={() =>
        track('product_click', { productId: product.id, slug: product.slug, location })
      }
      className="block"
    >
      <Card interactive className="h-full">
        <AspectRatio ratio={1} className="bg-primary-subtle rounded-t-md" />
        <CardBody>
          <Stack gap={1}>
            <Text className="text-secondary font-semibold">{product.name}</Text>
            {product.fromAmount != null && (
              <PriceTag
                amount={product.fromAmount}
                currency={product.currency}
                {...(product.compareAtAmount && product.compareAtAmount > product.fromAmount
                  ? { originalAmount: product.compareAtAmount }
                  : {})}
                size="sm"
              />
            )}
          </Stack>
        </CardBody>
      </Card>
    </Link>
  );
}
