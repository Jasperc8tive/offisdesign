'use client';

import Link from 'next/link';
import { AspectRatio, PriceTag, Stack, Text } from '@offisdesign/ui';
import { Media } from '../media/media';
import { useAnalytics } from '../../lib/providers';

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  fromAmount: number | null;
  currency: string;
  compareAtAmount?: number | null;
  /** First product image id, when the source carries one. */
  mediaId?: string | null;
}

interface Props {
  product: ProductCardData;
  location: string;
}

/**
 * The atomic product card used across home, collections, search, and
 * recommendations. Borderless and image-first: the photograph carries the card
 * and the name/price sit quietly beneath it. Hover lifts the image (scale) and
 * warms the name to crimson — no card chrome, no shadow.
 */
export function ProductCard({ product, location }: Props) {
  const { track } = useAnalytics();
  const onSale =
    product.compareAtAmount != null &&
    product.fromAmount != null &&
    product.compareAtAmount > product.fromAmount;

  return (
    <Link
      href={`/products/${product.slug}`}
      onClick={() =>
        track('product_click', { productId: product.id, slug: product.slug, location })
      }
      className="focus-visible:ring-primary group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
    >
      <AspectRatio ratio={1} className="bg-primary-subtle rounded-md">
        <Media
          mediaId={product.mediaId}
          alt={product.name}
          sizes="(min-width: 1024px) 25vw, (min-width: 600px) 33vw, 50vw"
          className="duration-slow ease-standard transition-transform group-hover:scale-[1.03]"
        />
        {onSale && (
          <span className="bg-primary text-on-dark font-body text-caption absolute left-3 top-3 rounded-full px-2.5 py-0.5 font-semibold uppercase tracking-wide">
            Sale
          </span>
        )}
      </AspectRatio>
      <Stack gap={1} className="mt-3">
        <Text className="text-secondary group-hover:text-primary duration-base ease-standard font-semibold transition-colors">
          {product.name}
        </Text>
        {product.fromAmount != null && (
          <PriceTag
            amount={product.fromAmount}
            currency={product.currency}
            {...(onSale ? { originalAmount: product.compareAtAmount as number } : {})}
            size="sm"
          />
        )}
      </Stack>
    </Link>
  );
}
