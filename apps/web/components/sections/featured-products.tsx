'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AspectRatio, Button, PriceTag, Skeleton, Stack, Text } from '@offisdesign/ui';
import { useProducts } from '../../lib/hooks';
import { SectionShell } from './section-shell';
import { useAnalytics } from '../../lib/providers';

export function FeaturedProducts({
  title,
  collection,
  sort = 'recent',
  location = 'home_featured',
}: {
  title: string;
  collection?: string;
  sort?: 'recent' | 'name' | 'price-asc' | 'price-desc';
  location?: string;
}) {
  const { data, isLoading, isError } = useProducts({
    pageSize: 4,
    sort,
    ...(collection ? { collection } : {}),
  });
  const { track } = useAnalytics();

  if (isError) return null;
  if (!isLoading && (!data || data.data.length === 0)) return null;

  const seeAllHref = collection
    ? `/search?collection=${encodeURIComponent(collection)}`
    : '/search';

  return (
    <SectionShell
      title={title}
      action={
        <Link href={seeAllHref}>
          <Button variant="link" trailingIcon={<ArrowRight width={16} height={16} aria-hidden />}>
            See all
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Stack gap={3} key={i}>
                <Skeleton className="aspect-square w-full" rounded="md" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </Stack>
            ))
          : data!.data.map((p) => {
              const variant = p.variants[0];
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  onClick={() =>
                    track('product_click', {
                      productId: p.id,
                      slug: p.slug,
                      location,
                    })
                  }
                  className="focus-visible:ring-primary group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
                >
                  <AspectRatio ratio={1} className="bg-primary-subtle rounded-md">
                    <div className="duration-slow ease-standard h-full w-full transition-transform group-hover:scale-[1.03]" />
                  </AspectRatio>
                  <Stack gap={1} className="mt-3">
                    <Text className="text-secondary group-hover:text-primary duration-base ease-standard font-semibold transition-colors">
                      {p.name}
                    </Text>
                    {variant && (
                      <PriceTag
                        amount={variant.priceAmount}
                        {...(variant.compareAtAmount
                          ? { originalAmount: variant.compareAtAmount }
                          : {})}
                        size="sm"
                      />
                    )}
                  </Stack>
                </Link>
              );
            })}
      </div>
    </SectionShell>
  );
}
