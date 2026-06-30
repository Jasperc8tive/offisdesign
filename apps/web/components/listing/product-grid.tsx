'use client';

import { Skeleton, Stack } from '@offisdesign/ui';
import { cn } from '@offisdesign/utils';
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

// Always two-up on mobile (premium grids never go single-column for products),
// stepping up to the requested column count on wider viewports.
const colsMap: Record<3 | 4, string> = {
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

function GridShell({ cols, children }: { cols: 3 | 4; children: React.ReactNode }) {
  return <div className={cn('grid gap-x-4 gap-y-8 md:gap-6', colsMap[cols])}>{children}</div>;
}

export function ProductGrid({
  products,
  isLoading,
  isError,
  location,
  emptyTitle = 'No matching products',
  emptyDescription = 'Try a different filter or sort.',
  cols = 4,
  skeletonCount = 8,
}: Props) {
  if (isLoading) {
    return (
      <GridShell cols={cols}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Stack gap={3} key={i}>
            <Skeleton className="aspect-square w-full" rounded="md" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </Stack>
        ))}
      </GridShell>
    );
  }
  if (isError) {
    return <EmptyResult title="Something went wrong" description="Try refreshing the page." />;
  }
  if (!products || products.length === 0) {
    return <EmptyResult title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <GridShell cols={cols}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} location={location} />
      ))}
    </GridShell>
  );
}
