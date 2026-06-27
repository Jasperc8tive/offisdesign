'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  AspectRatio,
  Button,
  Card,
  CardBody,
  Cluster,
  Grid,
  Heading,
  PriceTag,
  Skeleton,
  Stack,
  Text,
} from '@offisdesign/ui';
import { useProducts } from '../../lib/hooks';
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

  return (
    <Stack gap={4}>
      <Cluster justify="between" align="end">
        <Heading level={2}>{title}</Heading>
        <Link
          href={collection ? `/search?collection=${encodeURIComponent(collection)}` : '/search'}
        >
          <Button variant="link" trailingIcon={<ArrowRight width={16} height={16} aria-hidden />}>
            See all
          </Button>
        </Link>
      </Cluster>
      <Grid cols={4} gap={4}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-square w-full" rounded="md" />
                <CardBody>
                  <Stack gap={2}>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </Stack>
                </CardBody>
              </Card>
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
                >
                  <Card interactive className="h-full">
                    <AspectRatio ratio={1} className="bg-primary-subtle rounded-t-md" />
                    <CardBody>
                      <Stack gap={1}>
                        <Text className="text-secondary font-semibold">{p.name}</Text>
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
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
      </Grid>
    </Stack>
  );
}
