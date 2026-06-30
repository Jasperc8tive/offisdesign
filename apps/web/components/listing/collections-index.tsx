'use client';

import Link from 'next/link';
import { AspectRatio, Breadcrumb, Heading, Skeleton, Stack, Text } from '@offisdesign/ui';
import { useCollections } from '../../lib/hooks';
import { EmptyResult } from '../../lib/ux/async-boundary';
import { useAnalytics } from '../../lib/providers';

export function CollectionsIndex() {
  const { data, isLoading, isError } = useCollections({ pageSize: 50 });
  const { track } = useAnalytics();
  const collections = data?.data ?? [];

  return (
    <Stack gap={8}>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Collections' }]} />
      <Stack gap={2}>
        <Heading level={1}>Collections</Heading>
        <Text tone="muted" className="max-w-prose">
          Curated edits — by room, by material, by the way you work and live.
        </Text>
      </Stack>

      {isError ? (
        <EmptyResult title="Couldn’t load collections" description="Please try again shortly." />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Stack gap={3} key={i}>
              <Skeleton className="aspect-[4/3] w-full" rounded="md" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </Stack>
          ))}
        </div>
      ) : collections.length === 0 ? (
        <EmptyResult title="No collections yet" description="Check back soon." />
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${encodeURIComponent(c.slug)}`}
              onClick={() =>
                track('collection_click', {
                  collectionId: c.id,
                  slug: c.slug,
                  location: 'collections_index',
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
      )}
    </Stack>
  );
}
