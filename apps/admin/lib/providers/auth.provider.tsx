'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../api/services';
import { ApiError } from '../api/errors';
import type { Principal } from '../api/schemas';

interface AuthContextValue {
  principal: Principal | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Convenience: principal.permissions includes any of the listed scopes. */
  can: (...scopes: string[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

/**
 * Loads `/v1/auth/me` once and exposes the resulting principal (including the
 * RBAC permission bitset) to the rest of the admin tree. `useAuth().can(...)`
 * is the single source-of-truth the UI consults before rendering an action
 * — never hard-code a role string in a component.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.me(),
    retry: false,
    staleTime: 60_000,
    throwOnError: (err) => !(ApiError.is(err) && err.status === 401),
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => queryClient.removeQueries({ queryKey: ['auth'] }),
  });

  const principal = meQuery.data?.principal;
  const value: AuthContextValue = {
    principal,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!principal && principal.kind === 'admin',
    can: (...scopes) => {
      if (!principal) return false;
      const owned = new Set(principal.permissions);
      return scopes.some((s) => owned.has(s) || owned.has('*'));
    },
    login: async (email, password) => {
      await loginMutation.mutateAsync({ email, password });
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
