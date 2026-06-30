'use client';

import { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button, Checkbox, Divider, Radio, Stack, Text } from '@offisdesign/ui';
import { cn } from '@offisdesign/utils';
import type { SearchResult } from '../../lib/api/schemas';
import { isActive, toggleArrayFilter, type DiscoveryFilters } from '../../lib/filters/url';
import { useAnalytics } from '../../lib/providers';

interface Props {
  filters: DiscoveryFilters;
  onChange: (next: DiscoveryFilters) => void;
  facets: SearchResult['facets'];
  /** Optionally hide a facet when the page already pre-applies it. */
  hide?: { collection?: boolean; category?: boolean; tag?: boolean };
}

type FacetKey = 'collection' | 'category' | 'tag';

// Furniture price bands, in pence (matching the stored filter unit). `undefined`
// means an open bound. Presets keep price selection to one tap instead of two
// number fields.
const PRICE_PRESETS: Array<{ label: string; min?: number; max?: number }> = [
  { label: 'Any price' },
  { label: 'Under £500', max: 50_000 },
  { label: '£500 – £1,000', min: 50_000, max: 100_000 },
  { label: '£1,000 – £2,000', min: 100_000, max: 200_000 },
  { label: 'Over £2,000', min: 200_000 },
];

function humanize(slug: string): string {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function FacetGroup({
  label,
  facetKey,
  buckets,
  filters,
  onToggle,
}: {
  label: string;
  facetKey: FacetKey;
  buckets: SearchResult['facets']['collections'];
  filters: DiscoveryFilters;
  onToggle: (key: FacetKey, value: string) => void;
}) {
  if (buckets.length === 0) return null;
  return (
    <Stack gap={3}>
      <Text size="sm" className="text-secondary font-semibold uppercase tracking-[0.16em]">
        {label}
      </Text>
      <Stack gap={2} className="max-h-64 overflow-auto pr-1">
        {buckets.map((b) => {
          const active = filters[facetKey]?.includes(b.value) ?? false;
          return (
            <Checkbox
              key={b.value}
              checked={active}
              onChange={() => onToggle(facetKey, b.value)}
              label={
                <span className="inline-flex w-full items-center justify-between gap-3">
                  <span>{humanize(b.value)}</span>
                  <span className="text-muted font-body text-caption">{b.count}</span>
                </span>
              }
              className="w-full"
            />
          );
        })}
      </Stack>
    </Stack>
  );
}

function FilterBody({ filters, onChange, facets, hide }: Props) {
  const { track } = useAnalytics();

  function onToggle(key: FacetKey, value: string) {
    track('search_filter_changed', { facet: key, value });
    onChange(toggleArrayFilter(filters, key, value));
  }

  function selectPrice(preset: { min?: number; max?: number }) {
    track('search_filter_changed', {
      facet: 'price',
      value: `${preset.min ?? ''}-${preset.max ?? ''}`,
    });
    onChange({ ...filters, priceMin: preset.min, priceMax: preset.max, page: undefined });
  }

  return (
    <Stack gap={6} aria-label="Filters">
      {!hide?.collection && (
        <FacetGroup
          label="Collections"
          facetKey="collection"
          buckets={facets.collections}
          filters={filters}
          onToggle={onToggle}
        />
      )}
      {!hide?.category && (
        <FacetGroup
          label="Categories"
          facetKey="category"
          buckets={facets.categories}
          filters={filters}
          onToggle={onToggle}
        />
      )}
      {!hide?.tag && (
        <FacetGroup
          label="Tags"
          facetKey="tag"
          buckets={facets.tags}
          filters={filters}
          onToggle={onToggle}
        />
      )}

      <Divider />

      <Stack gap={3}>
        <Text size="sm" className="text-secondary font-semibold uppercase tracking-[0.16em]">
          Price
        </Text>
        <Stack gap={2} role="radiogroup" aria-label="Price">
          {PRICE_PRESETS.map((p) => {
            const selected =
              (filters.priceMin ?? undefined) === p.min &&
              (filters.priceMax ?? undefined) === p.max;
            return (
              <Radio
                key={p.label}
                name="price-preset"
                checked={selected}
                onChange={() => selectPrice(p)}
                label={p.label}
              />
            );
          })}
        </Stack>
      </Stack>

      {isActive(filters) && (
        <div>
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
            Clear all filters
          </Button>
        </div>
      )}
    </Stack>
  );
}

export function FilterSidebar(props: Props) {
  const { filters } = props;
  const [open, setOpen] = useState(false);

  const activeCount =
    (filters.collection?.length ?? 0) +
    (filters.category?.length ?? 0) +
    (filters.tag?.length ?? 0) +
    (filters.priceMin || filters.priceMax ? 1 : 0);

  return (
    <div>
      {/* Mobile disclosure — the sidebar is always visible from lg up. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="border-border text-secondary hover:border-border-strong focus-visible:shadow-focus mb-4 flex w-full items-center justify-between rounded-sm border px-4 py-3 transition-colors focus-visible:outline-none lg:hidden"
      >
        <span className="font-body inline-flex items-center gap-2 font-semibold">
          <SlidersHorizontal width={16} height={16} aria-hidden />
          Filters
          {activeCount > 0 && (
            <span className="bg-primary text-on-dark font-body text-caption inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-semibold">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown
          width={16}
          height={16}
          aria-hidden
          className={cn('duration-base ease-standard transition-transform', open && 'rotate-180')}
        />
      </button>

      <div className={cn('lg:block', open ? 'block' : 'hidden')}>
        <FilterBody {...props} />
      </div>
    </div>
  );
}
