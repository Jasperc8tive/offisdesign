'use client';

import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../api/services/inventory';

export const inventoryKeys = {
  availability: (variantIds: string[]) => ['inventory', 'availability', variantIds] as const,
};

export function useAvailability(variantIds: string[]) {
  return useQuery({
    queryKey: inventoryKeys.availability(variantIds),
    queryFn: ({ signal }) => inventoryService.availability(variantIds, signal),
    enabled: variantIds.length > 0,
    staleTime: 30_000,
  });
}
