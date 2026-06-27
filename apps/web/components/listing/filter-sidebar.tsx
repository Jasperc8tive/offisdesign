'use client';

import { Badge, Button, Cluster, FormField, Heading, Input, Stack, Text } from '@offisdesign/ui';
import type { SearchResult } from '../../lib/api/schemas';
import { toggleArrayFilter, type DiscoveryFilters } from '../../lib/filters/url';
import { useAnalytics } from '../../lib/providers';

interface Props {
  filters: DiscoveryFilters;
  onChange: (next: DiscoveryFilters) => void;
  facets: SearchResult['facets'];
  /** Optionally hide a facet when the page already pre-applies it. */
  hide?: { collection?: boolean; category?: boolean; tag?: boolean };
}

export function FilterSidebar({ filters, onChange, facets, hide }: Props) {
  const { track } = useAnalytics();

  function bucket(key: 'collection' | 'category' | 'tag', value: string) {
    track('search_filter_changed', { facet: key, value });
    onChange(toggleArrayFilter(filters, key, value));
  }

  return (
    <Stack gap={6} aria-label="Filters">
      {!hide?.collection && facets.collections.length > 0 && (
        <Stack gap={2}>
          <Heading level={4}>Collections</Heading>
          <Cluster gap={2}>
            {facets.collections.map((b) => {
              const active = filters.collection?.includes(b.value) ?? false;
              return (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => bucket('collection', b.value)}
                  className="focus-visible:shadow-focus rounded-sm focus-visible:outline-none"
                >
                  <Badge variant={active ? 'primary' : 'outline'}>
                    {b.value} · {b.count}
                  </Badge>
                </button>
              );
            })}
          </Cluster>
        </Stack>
      )}
      {!hide?.category && facets.categories.length > 0 && (
        <Stack gap={2}>
          <Heading level={4}>Categories</Heading>
          <Cluster gap={2}>
            {facets.categories.map((b) => {
              const active = filters.category?.includes(b.value) ?? false;
              return (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => bucket('category', b.value)}
                  className="focus-visible:shadow-focus rounded-sm focus-visible:outline-none"
                >
                  <Badge variant={active ? 'primary' : 'outline'}>
                    {b.value} · {b.count}
                  </Badge>
                </button>
              );
            })}
          </Cluster>
        </Stack>
      )}
      {!hide?.tag && facets.tags.length > 0 && (
        <Stack gap={2}>
          <Heading level={4}>Tags</Heading>
          <Cluster gap={2}>
            {facets.tags.map((b) => {
              const active = filters.tag?.includes(b.value) ?? false;
              return (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => bucket('tag', b.value)}
                  className="focus-visible:shadow-focus rounded-sm focus-visible:outline-none"
                >
                  <Badge variant={active ? 'primary' : 'outline'}>
                    {b.value} · {b.count}
                  </Badge>
                </button>
              );
            })}
          </Cluster>
        </Stack>
      )}
      <Stack gap={2}>
        <Heading level={4}>Price</Heading>
        <Cluster gap={3}>
          <FormField label="Min (£)" htmlFor="price-min">
            <Input
              id="price-min"
              type="number"
              min={0}
              value={filters.priceMin ? Math.floor(filters.priceMin / 100) : ''}
              onChange={(e) => {
                const next = e.target.value ? Number(e.target.value) * 100 : undefined;
                track('search_filter_changed', { facet: 'priceMin', value: String(next ?? '') });
                onChange({ ...filters, priceMin: next, page: undefined });
              }}
            />
          </FormField>
          <FormField label="Max (£)" htmlFor="price-max">
            <Input
              id="price-max"
              type="number"
              min={0}
              value={filters.priceMax ? Math.floor(filters.priceMax / 100) : ''}
              onChange={(e) => {
                const next = e.target.value ? Number(e.target.value) * 100 : undefined;
                track('search_filter_changed', { facet: 'priceMax', value: String(next ?? '') });
                onChange({ ...filters, priceMax: next, page: undefined });
              }}
            />
          </FormField>
        </Cluster>
        {(filters.priceMin || filters.priceMax) && (
          <Text size="sm" tone="muted">
            £{filters.priceMin ? Math.floor(filters.priceMin / 100) : 0}–£
            {filters.priceMax ? Math.floor(filters.priceMax / 100) : '∞'}
          </Text>
        )}
      </Stack>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange({
            ...(filters.q ? { q: filters.q } : {}),
            ...(filters.sort ? { sort: filters.sort } : {}),
          })
        }
      >
        Clear filters
      </Button>
    </Stack>
  );
}
