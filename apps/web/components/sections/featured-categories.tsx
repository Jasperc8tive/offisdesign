'use client';

import Link from 'next/link';
import { AspectRatio, Skeleton, Stack, Text } from '@offisdesign/ui';
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
    <SectionShell
      id="categories"
      eyebrow="Shop by workspace"
      title="Furniture for every part of the modern office."
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4 md:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Stack gap={3} key={i}>
                <Skeleton className="aspect-square w-full" rounded="md" />
                <Skeleton className="h-4 w-1/2" />
              </Stack>
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
                className="focus-visible:ring-primary group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
              >
                <AspectRatio ratio={1} className="bg-primary-subtle rounded-md">
                  <div className="duration-slow ease-standard h-full w-full transition-transform group-hover:scale-[1.03]" />
                </AspectRatio>
                <Text className="text-secondary group-hover:text-primary duration-base ease-standard mt-3 font-semibold transition-colors">
                  {c.name}
                </Text>
              </Link>
            ))}
      </div>
    </SectionShell>
  );
}
