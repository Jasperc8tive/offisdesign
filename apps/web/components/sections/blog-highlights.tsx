'use client';

import Link from 'next/link';
import { AspectRatio, Badge, Card, CardBody, Grid, Skeleton, Stack, Text } from '@offisdesign/ui';
import { useBlogPosts } from '../../lib/hooks';
import { SectionShell } from './section-shell';
import { useAnalytics } from '../../lib/providers';

export function BlogHighlights() {
  const { data, isLoading, isError } = useBlogPosts({ pageSize: 3 });
  const { track } = useAnalytics();

  if (isError) return null;
  if (!isLoading && (!data || data.data.length === 0)) return null;

  return (
    <SectionShell eyebrow="Journal" title="Latest thinking.">
      <Grid cols={3} gap={4}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-[16/9] w-full" rounded="md" />
                <CardBody>
                  <Stack gap={2}>
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-3/4" />
                  </Stack>
                </CardBody>
              </Card>
            ))
          : data!.data.map((p) => (
              <Link
                key={p.id}
                href={`/journal/${p.slug}`}
                onClick={() =>
                  track('cta_click', {
                    id: `post:${p.id}`,
                    location: 'blog_highlights',
                    href: `/journal/${p.slug}`,
                  })
                }
              >
                <Card interactive className="h-full">
                  <AspectRatio ratio={16 / 9} className="bg-primary-subtle rounded-t-md" />
                  <CardBody>
                    <Stack gap={1}>
                      {p.tags[0] && <Badge variant="muted">{p.tags[0]}</Badge>}
                      <Text className="text-secondary font-semibold">{p.title}</Text>
                      {p.excerpt && (
                        <Text size="sm" tone="muted">
                          {p.excerpt}
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
