'use client';

import { Badge, Skeleton } from '@offisdesign/ui';
import { useAvailability } from '../../lib/hooks';

interface Props {
  variantId: string;
}

/**
 * Live in-stock state for the active variant. Three buckets:
 *   in_stock   → "In stock"
 *   low_stock  → "Low stock"
 *   out_of_stock → "Out of stock"
 * The endpoint accepts batches; here we ask for the one selected variant.
 */
export function InventoryBadge({ variantId }: Props) {
  const { data, isLoading } = useAvailability([variantId]);
  if (isLoading) return <Skeleton className="h-5 w-20" />;
  const row = data?.find((r) => r.variantId === variantId);
  if (!row) return null;
  if (row.state === 'out_of_stock') return <Badge variant="outline">Out of stock</Badge>;
  if (row.state === 'low_stock') return <Badge variant="muted">Low stock ({row.available})</Badge>;
  return <Badge>In stock</Badge>;
}
