'use client';

import * as React from 'react';
import { readJson, subscribe, writeJson } from './storage';

const KEY = 'offis:recent-searches:v1';
const MAX_ITEMS = 8;

/** Hook backing the search overlay's "recent searches" affordance. */
export function useRecentSearches() {
  const [items, setItems] = React.useState<string[]>([]);

  React.useEffect(() => {
    setItems(readJson<string[]>(KEY, []));
    return subscribe(KEY, () => setItems(readJson<string[]>(KEY, [])));
  }, []);

  const push = React.useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      const without = items.filter((i) => i.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...without].slice(0, MAX_ITEMS);
      setItems(next);
      writeJson(KEY, next);
    },
    [items],
  );

  const remove = React.useCallback(
    (q: string) => {
      const next = items.filter((i) => i !== q);
      setItems(next);
      writeJson(KEY, next);
    },
    [items],
  );

  const clear = React.useCallback(() => {
    setItems([]);
    writeJson(KEY, []);
  }, []);

  return { items, push, remove, clear };
}
