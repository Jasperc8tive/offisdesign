'use client';

import * as React from 'react';
import { readJson, subscribe, writeJson } from './storage';

const KEY = 'offis:recently-viewed:v1';
const MAX_ITEMS = 12;

export interface RecentlyViewedItem {
  productId: string;
  slug: string;
  name: string;
  viewedAt: number;
}

interface ContextValue {
  items: RecentlyViewedItem[];
  track: (item: Omit<RecentlyViewedItem, 'viewedAt'>) => void;
  clear: () => void;
}

const RecentlyViewedContext = React.createContext<ContextValue | null>(null);

function read(): RecentlyViewedItem[] {
  return readJson<RecentlyViewedItem[]>(KEY, []);
}

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<RecentlyViewedItem[]>([]);

  React.useEffect(() => {
    setItems(read());
    return subscribe(KEY, () => setItems(read()));
  }, []);

  const value = React.useMemo<ContextValue>(
    () => ({
      items,
      track: (input) => {
        const without = items.filter((i) => i.productId !== input.productId);
        const next = [{ ...input, viewedAt: Date.now() }, ...without].slice(0, MAX_ITEMS);
        setItems(next);
        writeJson(KEY, next);
      },
      clear: () => {
        setItems([]);
        writeJson(KEY, []);
      },
    }),
    [items],
  );

  return <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>;
}

export function useRecentlyViewed(): ContextValue {
  const ctx = React.useContext(RecentlyViewedContext);
  if (!ctx) throw new Error('useRecentlyViewed must be used inside <RecentlyViewedProvider>');
  return ctx;
}
