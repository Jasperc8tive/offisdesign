'use client';

import * as React from 'react';
import { ThemeProvider } from '@offisdesign/ui';
import { QueryProvider } from './query.provider';
import { AuthProvider } from './auth.provider';
import { CartProvider } from './cart.provider';
import { ToastProvider } from './toast.provider';
import { FeatureFlagProvider, type FeatureFlagSnapshot } from './feature-flag.provider';
import { AnalyticsProvider } from '../analytics/provider';
import { WishlistProvider } from '../local-store/wishlist.provider';
import { RecentlyViewedProvider } from '../local-store/recently-viewed.provider';
import { GlobalErrorBoundary } from '../../components/error-boundary';

interface Props {
  children: React.ReactNode;
  featureFlags?: FeatureFlagSnapshot;
}

/**
 * Single composition root. Order matters:
 *   Query → Theme → Analytics → FeatureFlags → Auth → Cart → Wishlist → RecentlyViewed → Toast
 * Wishlist depends on Analytics (it tracks add/remove); RecentlyViewed is
 * dependency-free but kept near Wishlist for cohesion. Both are local-storage
 * backed and SSR-safe.
 */
export function Providers({ children, featureFlags = { flags: {} } }: Props) {
  return (
    <GlobalErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <AnalyticsProvider>
            <FeatureFlagProvider snapshot={featureFlags}>
              <AuthProvider>
                <CartProvider>
                  <WishlistProvider>
                    <RecentlyViewedProvider>
                      {children}
                      <ToastProvider />
                    </RecentlyViewedProvider>
                  </WishlistProvider>
                </CartProvider>
              </AuthProvider>
            </FeatureFlagProvider>
          </AnalyticsProvider>
        </ThemeProvider>
      </QueryProvider>
    </GlobalErrorBoundary>
  );
}

export { useAuth } from './auth.provider';
export { useCart } from './cart.provider';
export { useFeatureFlag, useFeatureFlags } from './feature-flag.provider';
export { toast } from './toast.provider';
export { useAnalytics, usePageView } from '../analytics/provider';
export { useWishlist } from '../local-store/wishlist.provider';
export { useRecentlyViewed } from '../local-store/recently-viewed.provider';
