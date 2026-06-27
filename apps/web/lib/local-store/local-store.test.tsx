import { act, render } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsProvider } from '../analytics/provider';
import { AuthProvider } from '../providers/auth.provider';
import { WishlistProvider, useWishlist } from './wishlist.provider';
import { RecentlyViewedProvider, useRecentlyViewed } from './recently-viewed.provider';

/** Capture the current hook return value through a mutable ref so tests can
 *  call the latest API after each act() while still observing state. */
function captureRef<T>() {
  return { current: undefined as unknown as T };
}

function WishlistCapture({ slot }: { slot: { current: ReturnType<typeof useWishlist> } }) {
  const api = useWishlist();
  slot.current = api;
  return null;
}

function RecentCapture({ slot }: { slot: { current: ReturnType<typeof useRecentlyViewed> } }) {
  const api = useRecentlyViewed();
  slot.current = api;
  return null;
}

describe('wishlist provider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Stub network so AuthProvider's /v1/customer/me hydration resolves as a
    // 401 instead of throwing an unhandled NetworkError.
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED' } }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
    ) as unknown as typeof fetch;
  });
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('toggle adds and removes the same product (anonymous mode)', async () => {
    const ref = captureRef<ReturnType<typeof useWishlist>>();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    render(
      <QueryClientProvider client={client}>
        <AnalyticsProvider>
          <AuthProvider>
            <WishlistProvider>
              <WishlistCapture slot={ref} />
            </WishlistProvider>
          </AuthProvider>
        </AnalyticsProvider>
      </QueryClientProvider>,
    );
    await act(async () => {
      await ref.current.toggle({ productId: 'p1', slug: 's1', name: 'A' });
    });
    expect(ref.current.has('p1')).toBe(true);
    await act(async () => {
      await ref.current.toggle({ productId: 'p1', slug: 's1', name: 'A' });
    });
    expect(ref.current.has('p1')).toBe(false);
  });
});

describe('recently viewed provider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('moves the most recent product to the head and dedupes', () => {
    const ref = captureRef<ReturnType<typeof useRecentlyViewed>>();
    render(
      <RecentlyViewedProvider>
        <RecentCapture slot={ref} />
      </RecentlyViewedProvider>,
    );
    act(() => ref.current.track({ productId: 'p1', slug: 's1', name: 'A' }));
    act(() => ref.current.track({ productId: 'p2', slug: 's2', name: 'B' }));
    act(() => ref.current.track({ productId: 'p1', slug: 's1', name: 'A' }));
    expect(ref.current.items.map((i) => i.productId)).toEqual(['p1', 'p2']);
  });
});
