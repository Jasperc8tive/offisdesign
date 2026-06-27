'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../api/services';
import { cartService } from '../api/services/cart';
import { ApiError } from '../api/errors';
import type { Customer } from '../api/schemas';

interface AuthContextValue {
  user: Customer | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

/**
 * Hydrates the current customer on mount via /v1/customer/me. The HTTP client
 * already handles cookie-based 401 → refresh transparently, so this hook just
 * mirrors the result for the rest of the app.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ['customer', 'me'],
    queryFn: () => customerService.me(),
    retry: false,
    staleTime: 60_000,
    // 401 surfaces as ApiError; we squash it to "not signed in".
    throwOnError: (error) => !(ApiError.is(error) && error.status === 401),
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      customerService.login(email, password),
    onSuccess: async () => {
      // Best-effort merge of the anonymous cart into the authenticated cart.
      try {
        await cartService.merge();
      } catch {
        // Non-fatal; the cart will reconcile on the next read.
      }
      await queryClient.invalidateQueries({ queryKey: ['customer', 'me'] });
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => customerService.logout(),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['customer'] });
      queryClient.removeQueries({ queryKey: ['cart'] });
    },
  });

  const value: AuthContextValue = {
    user: ApiError.is(meQuery.error) && meQuery.error.status === 401 ? undefined : meQuery.data,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    login: async (email, password) => {
      await loginMutation.mutateAsync({ email, password });
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer', 'me'] });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
