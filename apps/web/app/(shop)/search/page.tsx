'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import {
  Breadcrumb,
  Cluster,
  FormField,
  Heading,
  Input,
  Pagination,
  Stack,
  Tag,
  Text,
} from '@offisdesign/ui';
import { useSearch } from '../../../lib/hooks';
import { ProductGrid } from '../../../components/listing/product-grid';
import { FilterSidebar } from '../../../components/listing/filter-sidebar';
import { PlpToolbar } from '../../../components/listing/plp-toolbar';
import {
  parseFilters,
  serializeFilters,
  toggleArrayFilter,
  type DiscoveryFilters,
} from '../../../lib/filters/url';
import { useRecentSearches } from '../../../lib/local-store/recent-searches';
import { useAnalytics } from '../../../lib/providers';

const PAGE_SIZE = 24;

function SearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const recent = useRecentSearches();
  const { track } = useAnalytics();

  const filters = useMemo(() => parseFilters(new URLSearchParams(params.toString())), [params]);
  const [draftQ, setDraftQ] = useState(filters.q ?? '');

  const search = useSearch({
    ...filters,
    page: filters.page ?? 1,
    pageSize: PAGE_SIZE,
    sort: filters.sort ?? 'relevance',
  });

  function setFilters(next: DiscoveryFilters) {
    const sp = serializeFilters(next);
    router.push(`${pathname}?${sp.toString()}`);
  }

  function submitQuery() {
    if (draftQ.trim()) recent.push(draftQ);
    track('search_submitted', { q: draftQ });
    setFilters({ ...filters, q: draftQ || undefined, page: undefined });
  }

  return (
    <Stack gap={6}>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]} />
      <Heading level={1}>Shop</Heading>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuery();
        }}
      >
        <FormField label="Search" htmlFor="q">
          <Input
            id="q"
            placeholder="Search the catalogue"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            leadingIcon={<SearchIcon width={16} height={16} aria-hidden />}
          />
        </FormField>
      </form>

      <Cluster gap={3} align="center">
        {filters.collection?.map((slug) => (
          <Tag
            key={`coll-${slug}`}
            onRemove={() => setFilters(toggleArrayFilter(filters, 'collection', slug))}
          >
            collection: {slug}
          </Tag>
        ))}
        {filters.category?.map((slug) => (
          <Tag
            key={`cat-${slug}`}
            onRemove={() => setFilters(toggleArrayFilter(filters, 'category', slug))}
          >
            category: {slug}
          </Tag>
        ))}
        {filters.tag?.map((slug) => (
          <Tag
            key={`tag-${slug}`}
            onRemove={() => setFilters(toggleArrayFilter(filters, 'tag', slug))}
          >
            #{slug}
          </Tag>
        ))}
      </Cluster>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        <div>
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            facets={search.data?.facets ?? { collections: [], categories: [], tags: [] }}
          />
        </div>
        <section aria-label="Results">
          <Stack gap={6}>
            <PlpToolbar
              total={search.data?.total}
              sort={filters.sort ?? 'relevance'}
              onSortChange={(v) =>
                setFilters({ ...filters, sort: v as DiscoveryFilters['sort'], page: undefined })
              }
              selectId="sort-search"
            />
            <ProductGrid
              isLoading={search.isLoading}
              isError={search.isError}
              cols={3}
              location="search"
              products={search.data?.hits.map((h) => ({
                id: h.productId,
                slug: h.slug,
                name: h.name,
                fromAmount: h.fromAmount,
                currency: h.currency,
              }))}
              emptyTitle={filters.q ? `No matches for "${filters.q}"` : 'No matches'}
              emptyDescription="Try a different query or remove a filter."
            />
            {search.data && search.data.total > search.data.pageSize && (
              <div className="flex justify-center">
                <Pagination
                  page={search.data.page}
                  pageCount={Math.ceil(search.data.total / search.data.pageSize)}
                  onPageChange={(p) => {
                    track('search_paginated', { page: p });
                    setFilters({ ...filters, page: p });
                  }}
                />
              </div>
            )}
          </Stack>
        </section>
      </div>
    </Stack>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Text tone="muted">Loading…</Text>}>
      <SearchContent />
    </Suspense>
  );
}
