'use client';

import Link from 'next/link';
import { AspectRatio, Heading, Stack, Text } from '@offisdesign/ui';
import { useRecentlyViewed } from '../../lib/providers';
import { useAnalytics } from '../../lib/providers';

interface Props {
  excludeProductId?: string;
}

export function RecentlyViewedStrip({ excludeProductId }: Props) {
  const { items } = useRecentlyViewed();
  const { track } = useAnalytics();
  const list = items.filter((i) => i.productId !== excludeProductId).slice(0, 4);
  if (list.length === 0) return null;
  return (
    <Stack gap={4}>
      <Heading level={2}>Recently viewed</Heading>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">
        {list.map((p) => (
          <Link
            key={p.productId}
            href={`/products/${p.slug}`}
            onClick={() =>
              track('product_click', {
                productId: p.productId,
                slug: p.slug,
                location: 'recently_viewed',
              })
            }
            className="focus-visible:ring-primary group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
          >
            <AspectRatio ratio={1} className="bg-primary-subtle rounded-md">
              <div className="duration-slow ease-standard h-full w-full transition-transform group-hover:scale-[1.03]" />
            </AspectRatio>
            <Text className="text-secondary group-hover:text-primary duration-base ease-standard mt-3 font-semibold transition-colors">
              {p.name}
            </Text>
          </Link>
        ))}
      </div>
    </Stack>
  );
}
