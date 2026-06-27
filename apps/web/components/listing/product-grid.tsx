'use client';

import { AspectRatio, Card, CardBody, Grid, Skeleton, Stack } from '@offisdesign/ui';
import { ProductCard, type ProductCardData } from './product-card';
import { EmptyResult } from '../../lib/ux/async-boundary';

interface Props {
  products: ProductCardData[] | undefined;
  isLoading: boolean;
  isError: boolean;
  location: string;
  emptyTitle?: string;
  emptyDescription?: string;
  cols?: 3 | 4;
  skeletonCount?: number;
}

export function ProductGrid({
  products,
  isLoading,
  isError,
  location,
  emptyTitle = 'No matches',
  emptyDescription = 'Try a different filter or sort.',
  cols = 4,
  skeletonCount = 8,
}: Props) {
  if (isLoading) {
    return (
      <Grid cols={cols} gap={4}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Card key={i}>
            <AspectRatio ratio={1} className="bg-primary-subtle rounded-t-md" />
            <CardBody>
              <Stack gap={2}>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </Stack>
            </CardBody>
          </Card>
        ))}
      </Grid>
    );
  }
  if (isError) {
    return <EmptyResult title="Something went wrong" description="Try refreshing the page." />;
  }
  if (!products || products.length === 0) {
    return <EmptyResult title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <Grid cols={cols} gap={4}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} location={location} />
      ))}
    </Grid>
  );
}
