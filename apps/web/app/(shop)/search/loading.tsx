import { Skeleton, Stack } from '@offisdesign/ui';

export default function SearchLoading() {
  return (
    <Stack gap={6} aria-label="Loading results">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-12 w-full" rounded="md" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Stack gap={4}>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-44 w-full" rounded="md" />
        </Stack>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Stack gap={3} key={i}>
              <Skeleton className="aspect-square w-full" rounded="md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Stack>
          ))}
        </div>
      </div>
    </Stack>
  );
}
