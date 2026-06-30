import { Grid, Skeleton, Stack } from '@offisdesign/ui';

export default function ProductLoading() {
  return (
    <Stack gap={8} aria-label="Loading product">
      <Skeleton className="h-4 w-64" />
      <Grid cols={2} gap={8}>
        <Skeleton className="aspect-[4/5] w-full" rounded="md" />
        <Stack gap={4}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-11 w-full" rounded="md" />
        </Stack>
      </Grid>
    </Stack>
  );
}
