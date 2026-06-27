import { Skeleton, Stack } from '@offisdesign/ui';

export default function ShopLoading() {
  return (
    <Stack gap={4} aria-label="Loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-64 w-full" rounded="md" />
    </Stack>
  );
}
