'use client';

import Link from 'next/link';
import { AspectRatio, Badge, Skeleton, Stack, Text } from '@offisdesign/ui';
import { useBlogPosts } from '../../lib/hooks';
import { SectionShell } from './section-shell';
import { useAnalytics } from '../../lib/providers';

export function BlogHighlights() {
  const { data, isLoading, isError } = useBlogPosts({ pageSize: 3 });
  const { track } = useAnalytics();

  if (isError) return null;
  if (!isLoading && (!data || data.data.length === 0)) return null;

  return (
    <SectionShell id="journal" eyebrow="Journal" title="Latest thinking.">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Stack gap={3} key={i}>
                <Skeleton className="aspect-[16/9] w-full" rounded="md" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
              </Stack>
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
                className="focus-visible:ring-primary group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
              >
                <AspectRatio ratio={16 / 9} className="bg-primary-subtle rounded-md">
                  <div className="duration-slow ease-standard h-full w-full transition-transform group-hover:scale-[1.03]" />
                </AspectRatio>
                <Stack gap={2} className="mt-3">
                  {p.tags[0] && <Badge variant="muted">{p.tags[0]}</Badge>}
                  <Text className="text-secondary group-hover:text-primary duration-base ease-standard font-semibold transition-colors">
                    {p.title}
                  </Text>
                  {p.excerpt && (
                    <Text size="sm" tone="muted">
                      {p.excerpt}
                    </Text>
                  )}
                </Stack>
              </Link>
            ))}
      </div>
    </SectionShell>
  );
}
