'use client';

import { use, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Breadcrumb,
  Cluster,
  FormField,
  Grid,
  Heading,
  Pagination,
  Select,
  Stack,
  Text,
} from '@offisdesign/ui';
import { useSearch } from '../../../../lib/hooks';
import { JsonLd } from '../../../../components/seo/json-ld';
import { breadcrumbJsonLd } from '../../../../components/seo/schemas';
import { ProductGrid } from '../../../../components/listing/product-grid';
import { FilterSidebar } from '../../../../components/listing/filter-sidebar';
import { parseFilters, serializeFilters, type DiscoveryFilters } from '../../../../lib/filters/url';

const PAGE_SIZE = 24;

export default function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const search = useSearch({
    ...filters,
    tag: [slug, ...(filters.tag ?? [])],
    page: filters.page ?? 1,
    pageSize: PAGE_SIZE,
    sort: filters.sort ?? 'relevance',
  });

  function setFilters(next: DiscoveryFilters) {
    const sp = serializeFilters(next);
    router.push(`${pathname}?${sp.toString()}`);
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/search' },
    { label: `#${slug}` },
  ];

  return (
    <Stack gap={8}>
      <JsonLd
        payload={breadcrumbJsonLd(
          breadcrumbs.map((b) => ({ label: b.label, href: b.href ?? '#' })),
        )}
      />
      <Breadcrumb items={breadcrumbs} />
      <Stack gap={2}>
        <Heading level={1}>#{slug}</Heading>
        <Text tone="muted">Items tagged {slug}.</Text>
      </Stack>

      <Grid cols={4} gap={6}>
        <div className="lg:col-span-1">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            facets={search.data?.facets ?? { collections: [], categories: [], tags: [] }}
            hide={{ tag: true }}
          />
        </div>
        <section aria-label="Products" className="lg:col-span-3">
          <Cluster justify="between" align="center" className="mb-4">
            <Text size="sm" tone="muted">
              {search.data ? `${search.data.total} results` : 'Loading…'}
            </Text>
            <FormField label="Sort" htmlFor="sort-t">
              <Select
                id="sort-t"
                value={filters.sort ?? 'relevance'}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    sort: e.target.value as DiscoveryFilters['sort'],
                    page: undefined,
                  })
                }
              >
                <option value="relevance">Relevance</option>
                <option value="recent">Newest</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
              </Select>
            </FormField>
          </Cluster>
          <ProductGrid
            isLoading={search.isLoading}
            isError={search.isError}
            cols={3}
            location={`tag:${slug}`}
            products={search.data?.hits.map((h) => ({
              id: h.productId,
              slug: h.slug,
              name: h.name,
              fromAmount: h.fromAmount,
              currency: h.currency,
            }))}
          />
          {search.data && search.data.total > search.data.pageSize && (
            <div className="mt-8 flex justify-center">
              <Pagination
                page={search.data.page}
                pageCount={Math.ceil(search.data.total / search.data.pageSize)}
                onPageChange={(p) => setFilters({ ...filters, page: p })}
              />
            </div>
          )}
        </section>
      </Grid>
    </Stack>
  );
}
