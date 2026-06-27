'use client';

import * as React from 'react';

export interface FeatureFlagSnapshot {
  /** A pre-hydrated map of flag-key → enabled, supplied by the server. */
  flags: Record<string, boolean>;
  /** Identifier used by the server to bucket the current viewer. */
  subjectId?: string;
}

const FeatureFlagContext = React.createContext<FeatureFlagSnapshot>({ flags: {} });

/**
 * Feature flag access. The storefront receives a flag snapshot from the
 * server (e.g. as part of the root layout fetch); client components read
 * via `useFeatureFlag`. Default-off if a flag is unknown.
 */
export function FeatureFlagProvider({
  snapshot,
  children,
}: {
  snapshot: FeatureFlagSnapshot;
  children: React.ReactNode;
}) {
  return <FeatureFlagContext.Provider value={snapshot}>{children}</FeatureFlagContext.Provider>;
}

export function useFeatureFlag(key: string): boolean {
  return React.useContext(FeatureFlagContext).flags[key] ?? false;
}

export function useFeatureFlags(): FeatureFlagSnapshot {
  return React.useContext(FeatureFlagContext);
}
