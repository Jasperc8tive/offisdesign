'use client';

import Link from 'next/link';
import { AspectRatio, Card, CardBody, Grid, Skeleton, Stack, Text } from '@offisdesign/ui';
import { useCollections } from '../../lib/hooks';
import { SectionShell } from './section-shell';
import { useAnalytics } from '../../lib/providers';

export function FeaturedCollections() {
  const { data, isLoading, isError } = useCollections({ pageSize: 3 });
  const { track } = useAnalytics();

  if (isError) return null;
  if (!isLoading && (!data || data.data.length === 0)) return null;

  return (
    <SectionShell eyebrow="Featured collections" title="Curated sets.">
      <Grid cols={3} gap={4}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-[4/3] w-full" rounded="md" />
                <CardBody>
                  <Stack gap={2}>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </Stack>
                </CardBody>
              </Card>
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
              >
                <Card interactive className="h-full">
                  <AspectRatio ratio={4 / 3} className="bg-primary-subtle rounded-t-md" />
                  <CardBody>
                    <Stack gap={1}>
                      <Text className="text-secondary font-semibold">{c.name}</Text>
                      {c.description && (
                        <Text size="sm" tone="muted">
                          {c.description}
                        </Text>
                      )}
                    </Stack>
                  </CardBody>
                </Card>
              </Link>
            ))}
      </Grid>
    </SectionShell>
  );
}
