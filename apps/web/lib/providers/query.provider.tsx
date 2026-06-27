'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '../api/errors';

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 30 s stale; tune per-query via `staleTime` overrides.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry(failureCount, error) {
          // Never retry auth/4xx errors — they will not become healthy on retry.
          if (ApiError.is(error) && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: 0 },
    },
  });
}

let browserClient: QueryClient | undefined;
function getClient() {
  if (typeof window === 'undefined') return makeClient();
  if (!browserClient) browserClient = makeClient();
  return browserClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = getClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
