'use client';

import Link from 'next/link';
import { AspectRatio, Card, CardBody, Grid, Heading, Stack, Text } from '@offisdesign/ui';
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
      <Grid cols={4} gap={4}>
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
          >
            <Card interactive className="h-full">
              <AspectRatio ratio={1} className="bg-primary-subtle rounded-t-md" />
              <CardBody>
                <Stack gap={1}>
                  <Text className="text-secondary font-semibold">{p.name}</Text>
                </Stack>
              </CardBody>
            </Card>
          </Link>
        ))}
      </Grid>
    </Stack>
  );
}
