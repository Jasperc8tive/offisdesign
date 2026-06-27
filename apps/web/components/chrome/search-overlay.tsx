'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, Search as SearchIcon, X } from 'lucide-react';
import { Cluster, FormField, Icon, Input, Stack, Text } from '@offisdesign/ui';
import { Drawer } from './drawer';
import { useAutocomplete } from '../../lib/hooks';
import { useAnalytics } from '../../lib/providers';
import { useRecentSearches } from '../../lib/local-store/recent-searches';

const EMPTY_SUGGESTIONS = ['Sofas', 'Dining tables', 'Walnut', 'Workspace', 'Storage'];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { track } = useAnalytics();
  const recent = useRecentSearches();
  const [q, setQ] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const { data, isFetching } = useAutocomplete(q);
  const hits = data ?? [];

  useEffect(() => {
    if (open) {
      setQ('');
      setFocusedIndex(-1);
    }
  }, [open]);

  function go(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    recent.push(trimmed);
    track('search_submitted', { q: trimmed });
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (hits.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => (i + 1) % hits.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => (i <= 0 ? hits.length - 1 : i - 1));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      const hit = hits[focusedIndex];
      if (hit) {
        track('product_click', {
          productId: hit.productId,
          slug: hit.slug,
          location: 'search_overlay',
        });
        onClose();
        router.push(`/products/${hit.slug}`);
      }
    }
  }

  return (
    <Drawer open={open} onClose={onClose} side="top" label="Search" title="Search">
      <Stack gap={4} className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(q);
          }}
        >
          <FormField label="Search the catalogue" htmlFor="search-overlay">
            <Input
              id="search-overlay"
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setFocusedIndex(-1);
              }}
              onKeyDown={onKeyDown}
              placeholder="What are you looking for?"
              leadingIcon={<SearchIcon width={16} height={16} aria-hidden />}
              aria-autocomplete="list"
              aria-expanded={hits.length > 0}
              aria-activedescendant={focusedIndex >= 0 ? `ac-${focusedIndex}` : undefined}
            />
          </FormField>
        </form>

        {q.length < 2 && recent.items.length > 0 && (
          <Stack gap={2}>
            <Cluster justify="between" align="center">
              <Text size="sm" tone="muted">
                Recent searches
              </Text>
              <button
                type="button"
                onClick={recent.clear}
                className="font-body text-caption text-muted hover:text-primary"
              >
                Clear
              </button>
            </Cluster>
            <Stack gap={1} as="ul">
              {recent.items.map((s) => (
                <li key={s} className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => go(s)}
                    className="font-body text-body-sm text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:shadow-focus flex flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors focus-visible:outline-none"
                  >
                    <Icon icon={Clock} size="sm" decorative />
                    {s}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove recent search "${s}"`}
                    onClick={() => recent.remove(s)}
                    className="text-muted hover:text-primary rounded-sm p-1"
                  >
                    <Icon icon={X} size="sm" decorative />
                  </button>
                </li>
              ))}
            </Stack>
          </Stack>
        )}

        {q.length < 2 && recent.items.length === 0 && (
          <Stack gap={2}>
            <Text size="sm" tone="muted">
              Try one of these
            </Text>
            <Cluster gap={2} wrap>
              {EMPTY_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => go(s)}
                  className="border-border-strong font-body text-body-sm text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:shadow-focus rounded-sm border px-3 py-1 transition-colors focus-visible:outline-none"
                >
                  {s}
                </button>
              ))}
            </Cluster>
          </Stack>
        )}

        {q.length >= 2 && (
          <Stack gap={2} role="listbox" aria-label="Search suggestions">
            <Text size="sm" tone="muted">
              {isFetching
                ? 'Searching…'
                : `${hits.length} suggestion${hits.length === 1 ? '' : 's'}`}
            </Text>
            <Stack gap={1}>
              {hits.map((hit, i) => (
                <Link
                  key={hit.productId}
                  id={`ac-${i}`}
                  href={`/products/${hit.slug}`}
                  role="option"
                  aria-selected={i === focusedIndex}
                  onClick={() => {
                    track('product_click', {
                      productId: hit.productId,
                      slug: hit.slug,
                      location: 'search_overlay',
                    });
                    onClose();
                  }}
                  className={
                    i === focusedIndex
                      ? 'bg-primary-subtle font-body text-body-sm text-primary focus-visible:shadow-focus block rounded-sm px-3 py-2 transition-colors focus-visible:outline-none'
                      : 'font-body text-body-sm text-secondary hover:bg-primary-subtle hover:text-primary focus-visible:shadow-focus block rounded-sm px-3 py-2 transition-colors focus-visible:outline-none'
                  }
                >
                  {hit.name}
                </Link>
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
}
