'use client';

import { Select, Text } from '@offisdesign/ui';

interface Props {
  /** Total result count; `undefined` renders a loading label. */
  total: number | undefined;
  sort: string;
  onSortChange: (value: string) => void;
  /** Unique id so the inline label associates with the right select. */
  selectId: string;
  noun?: string;
}

/**
 * Shared listing toolbar — result count on the left, an inline sort control on
 * the right. Used by search, category, and collection pages so the row reads
 * identically everywhere.
 */
export function PlpToolbar({ total, sort, onSortChange, selectId, noun = 'result' }: Props) {
  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <Text size="sm" tone="muted">
        {total === undefined ? 'Loading…' : `${total} ${total === 1 ? noun : `${noun}s`}`}
      </Text>
      <div className="flex items-center gap-2">
        <label htmlFor={selectId} className="font-body text-body-sm text-muted whitespace-nowrap">
          Sort by
        </label>
        <div className="w-48">
          <Select id={selectId} value={sort} onChange={(e) => onSortChange(e.target.value)}>
            <option value="relevance">Relevance</option>
            <option value="recent">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
