'use client';

import Link from 'next/link';
import { AspectRatio, Card, CardFooter, Grid, Skeleton, Stack, Text } from '@offisdesign/ui';
import { useCategories } from '../../lib/hooks';
import { SectionShell } from './section-shell';
import { useAnalytics } from '../../lib/providers';

export function FeaturedCategories() {
  const { data, isLoading, isError } = useCategories();
  const { track } = useAnalytics();
  const top = data?.filter((c) => c.parentId === null).slice(0, 4) ?? [];

  if (isError) return null;
  if (!isLoading && top.length === 0) return null;

  return (
    <SectionShell eyebrow="Shop by room" title="Spaces for every part of home and work.">
      <Grid cols={4} gap={4}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-square w-full" rounded="md" />
                <CardFooter className="border-t-0 pt-4">
                  <Skeleton className="h-4 w-1/2" />
                </CardFooter>
              </Card>
            ))
          : top.map((c) => (
              <Link
                key={c.id}
                href={`/search?category=${encodeURIComponent(c.slug)}`}
                onClick={() =>
                  track('collection_click', {
                    collectionId: c.id,
                    slug: c.slug,
                    location: 'home_categories',
                  })
                }
              >
                <Card interactive className="h-full">
                  <AspectRatio ratio={1} className="bg-primary-subtle rounded-t-md" />
                  <CardFooter className="border-t-0 pt-4">
                    <Stack gap={0}>
                      <Text className="text-secondary font-semibold">{c.name}</Text>
                    </Stack>
                  </CardFooter>
                </Card>
              </Link>
            ))}
      </Grid>
    </SectionShell>
  );
}
