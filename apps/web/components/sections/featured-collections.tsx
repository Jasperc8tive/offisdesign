'use client';

import Link from 'next/link';
import { AspectRatio, Skeleton, Stack, Text } from '@offisdesign/ui';
import { useCollections } from '../../lib/hooks';
import { SectionShell } from './section-shell';
import { useAnalytics } from '../../lib/providers';

export function FeaturedCollections() {
  const { data, isLoading, isError } = useCollections({ pageSize: 3 });
  const { track } = useAnalytics();

  if (isError) return null;
  if (!isLoading && (!data || data.data.length === 0)) return null;

  return (
    <SectionShell id="collections" eyebrow="Collections" title="Curated for the way you work.">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Stack gap={3} key={i}>
                <Skeleton className="aspect-[4/3] w-full" rounded="md" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </Stack>
            ))
          : data!.data.map((c) => (
              <Link
                key={c.id}
                href={`/search?collection=${encodeURIComponent(c.slug)}`}
                onClick={() =>
                  track('collection_click', {
                    collectionId: c.id,
                    slug: c.slug,
                    location: 'home_collections',
                  })
                }
                className="focus-visible:ring-primary group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
              >
                <AspectRatio ratio={4 / 3} className="bg-primary-subtle rounded-md">
                  <div className="duration-slow ease-standard h-full w-full transition-transform group-hover:scale-[1.03]" />
                </AspectRatio>
                <Stack gap={1} className="mt-3">
                  <Text className="text-secondary group-hover:text-primary duration-base ease-standard font-semibold transition-colors">
                    {c.name}
                  </Text>
                  {c.description && (
                    <Text size="sm" tone="muted">
                      {c.description}
                    </Text>
                  )}
                </Stack>
              </Link>
            ))}
      </div>
    </SectionShell>
  );
}
