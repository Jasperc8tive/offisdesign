'use client';

import * as React from 'react';
import { useAuth } from '../lib/providers/auth.provider';

interface Props {
  /** Any of these permission scopes grants render. */
  any: string[];
  children: React.ReactNode;
  /** Optional fallback when the principal lacks the scope. */
  fallback?: React.ReactNode;
}

/**
 * Permission gate. The cardinal rule of Stage 13 is that disabled actions
 * never render — the surface area shrinks rather than greying out, so users
 * cannot guess at what's hidden. Always wrap admin actions in `<Can>` even
 * if the server would refuse: the UI shouldn't lie about availability.
 */
export function Can({ any, children, fallback = null }: Props) {
  const { can } = useAuth();
  if (!can(...any)) return <>{fallback}</>;
  return <>{children}</>;
}
