'use client';

import { use, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { AspectRatio, Breadcrumb, Heading, Pagination, Stack, Text } from '@offisdesign/ui';
import { useCollection, useSearch } from '../../../../lib/hooks';
import { JsonLd } from '../../../../components/seo/json-ld';
import { breadcrumbJsonLd } from '../../../../components/seo/schemas';
import { ProductGrid } from '../../../../components/listing/product-grid';
import { FilterSidebar } from '../../../../components/listing/filter-sidebar';
import { PlpToolbar } from '../../../../components/listing/plp-toolbar';
import { parseFilters, serializeFilters, type DiscoveryFilters } from '../../../../lib/filters/url';
import { EmptyResult } from '../../../../lib/ux/async-boundary';
import { usePageView } from '../../../../lib/providers';

const PAGE_SIZE = 24;

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const collection = useCollection(slug);
  const search = useSearch({
    ...filters,
    collection: [slug, ...(filters.collection ?? [])],
    page: filters.page ?? 1,
    pageSize: PAGE_SIZE,
    sort: filters.sort ?? 'relevance',
  });

  usePageView(pathname);

  function setFilters(next: DiscoveryFilters) {
    const sp = serializeFilters(next);
    router.push(`${pathname}?${sp.toString()}`);
  }

  if (collection.isError || (!collection.isLoading && !collection.data)) {
    return <EmptyResult title="Collection not found" description="It may have been removed." />;
  }

  const c = collection.data;
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Collections', href: '/collections' },
    { label: c?.name ?? '…' },
  ];

  return (
    <Stack gap={8}>
      <JsonLd
        payload={breadcrumbJsonLd(
          breadcrumbs.map((b) => ({ label: b.label, href: b.href ?? '#' })),
        )}
      />
      <Breadcrumb items={breadcrumbs} />

      {/* Hero banner — uses the design-system Card pattern with an AspectRatio media slot. */}
      <section aria-labelledby="collection-hero">
        <Stack gap={4}>
          <AspectRatio ratio={21 / 9} className="bg-primary-subtle rounded-md" />
          <Stack gap={2}>
            <Heading level={1} id="collection-hero">
              {c?.name ?? slug}
            </Heading>
            {c?.description && (
              <Text tone="muted" className="max-w-prose">
                {c.description}
              </Text>
            )}
          </Stack>
        </Stack>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        <div>
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            facets={
              search.data?.facets ?? {
                collections: [],
                categories: [],
                tags: [],
              }
            }
            hide={{ collection: true }}
          />
        </div>
        <section aria-label="Products">
          <Stack gap={6}>
            <PlpToolbar
              total={search.data?.total}
              sort={filters.sort ?? 'relevance'}
              onSortChange={(v) =>
                setFilters({ ...filters, sort: v as DiscoveryFilters['sort'], page: undefined })
              }
              selectId="sort-collection"
            />
            <ProductGrid
              isLoading={search.isLoading}
              isError={search.isError}
              cols={3}
              location={`collection:${slug}`}
              products={search.data?.hits.map((h) => ({
                id: h.productId,
                slug: h.slug,
                name: h.name,
                fromAmount: h.fromAmount,
                currency: h.currency,
              }))}
            />
            {search.data && search.data.total > search.data.pageSize && (
              <div className="flex justify-center">
                <Pagination
                  page={search.data.page}
                  pageCount={Math.ceil(search.data.total / search.data.pageSize)}
                  onPageChange={(p) => setFilters({ ...filters, page: p })}
                />
              </div>
            )}
          </Stack>
        </section>
      </div>
    </Stack>
  );
}
