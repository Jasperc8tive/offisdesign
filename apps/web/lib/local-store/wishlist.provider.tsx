'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readJson, subscribe, writeJson } from './storage';
import { useAnalytics } from '../analytics/provider';
import { useAuth } from '../providers/auth.provider';
import { wishlistService } from '../api/services/wishlist';
import { ApiError } from '../api/errors';

const KEY = 'offis:wishlist:v1';
const MAX_ITEMS = 100;
const SERVER_KEY = ['wishlist', 'server'] as const;

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  addedAt: number;
}

interface ContextValue {
  items: WishlistItem[];
  has: (productId: string) => boolean;
  toggle: (item: Omit<WishlistItem, 'addedAt'>) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => void;
  count: number;
  /** True when the server is the source of truth (signed-in customer). */
  serverBacked: boolean;
}

const WishlistContext = React.createContext<ContextValue | null>(null);

function readLocal(): WishlistItem[] {
  return readJson<WishlistItem[]>(KEY, []);
}
function writeLocal(items: WishlistItem[]) {
  writeJson(KEY, items);
}

/**
 * Two-mode wishlist:
 *  - Anonymous → localStorage (Stage 10 behaviour preserved).
 *  - Authenticated → server-backed via /v1/customer/wishlist, with the
 *    React Query cache mirroring the canonical list.
 *
 * On login we merge the anonymous list into the server via POST /merge, then
 * clear the local store so the two modes never disagree.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { track } = useAnalytics();
  const [local, setLocal] = React.useState<WishlistItem[]>([]);

  const isAuth = auth.isAuthenticated && !!auth.user;

  React.useEffect(() => {
    setLocal(readLocal());
    return subscribe(KEY, () => setLocal(readLocal()));
  }, []);

  const serverQuery = useQuery({
    queryKey: SERVER_KEY,
    queryFn: () => wishlistService.list(),
    enabled: isAuth,
    staleTime: 30_000,
  });

  // On sign-in: merge local → server, then clear local. Tracked per
  // customer id so we don't repeat the merge on re-renders.
  const mergedFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!isAuth || !auth.user) return;
    if (mergedFor.current === auth.user.id) return;
    mergedFor.current = auth.user.id;
    const localList = readLocal();
    const productIds = localList.map((i) => i.productId);
    wishlistService
      .merge(productIds)
      .then(() => {
        if (productIds.length > 0) {
          writeLocal([]);
          setLocal([]);
        }
        queryClient.invalidateQueries({ queryKey: SERVER_KEY });
      })
      .catch(() => {
        // Network / 401: fall back to local mode; user can retry by toggling again.
      });
  }, [isAuth, auth.user, queryClient]);

  const addMutation = useMutation({
    mutationFn: (productId: string) => wishlistService.add(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SERVER_KEY }),
  });
  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistService.remove(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SERVER_KEY }),
  });

  const items = React.useMemo<WishlistItem[]>(() => {
    if (isAuth) {
      return (serverQuery.data ?? []).map((row) => ({
        productId: row.productId,
        slug: row.product?.slug ?? '',
        name: row.product?.name ?? '',
        addedAt: new Date(row.addedAt).getTime(),
      }));
    }
    return local;
  }, [isAuth, serverQuery.data, local]);

  async function toggle(input: Omit<WishlistItem, 'addedAt'>) {
    const exists = items.some((i) => i.productId === input.productId);
    if (isAuth) {
      try {
        if (exists) {
          await removeMutation.mutateAsync(input.productId);
          track('cta_click', { id: `wishlist-remove:${input.productId}`, location: 'wishlist' });
        } else {
          await addMutation.mutateAsync(input.productId);
          track('cta_click', { id: `wishlist-add:${input.productId}`, location: 'wishlist' });
        }
      } catch (err) {
        if (!ApiError.is(err) || err.status !== 401) throw err;
      }
      return;
    }
    if (exists) {
      const next = local.filter((i) => i.productId !== input.productId);
      setLocal(next);
      writeLocal(next);
      track('cta_click', { id: `wishlist-remove:${input.productId}`, location: 'wishlist' });
    } else {
      const next = [{ ...input, addedAt: Date.now() }, ...local].slice(0, MAX_ITEMS);
      setLocal(next);
      writeLocal(next);
      track('cta_click', { id: `wishlist-add:${input.productId}`, location: 'wishlist' });
    }
  }

  async function remove(productId: string) {
    if (isAuth) {
      await removeMutation.mutateAsync(productId).catch(() => undefined);
      return;
    }
    const next = local.filter((i) => i.productId !== productId);
    setLocal(next);
    writeLocal(next);
  }

  function clear() {
    if (isAuth) {
      Promise.all(items.map((i) => removeMutation.mutateAsync(i.productId))).catch(() => undefined);
    } else {
      setLocal([]);
      writeLocal([]);
    }
  }

  const value: ContextValue = {
    items,
    count: items.length,
    has: (productId) => items.some((i) => i.productId === productId),
    toggle,
    remove,
    clear,
    serverBacked: isAuth,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): ContextValue {
  const ctx = React.useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}
