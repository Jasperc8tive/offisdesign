'use client';

import * as React from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { Alert, Button, EmptyState, Skeleton, Stack } from '@offisdesign/ui';
import { ApiError } from '../api/errors';

interface AsyncBoundaryProps {
  children: React.ReactNode;
  pendingFallback?: React.ReactNode;
  errorFallback?: (props: FallbackProps) => React.ReactElement;
}

function DefaultPending() {
  return (
    <Stack gap={3}>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-40 w-full" rounded="md" />
    </Stack>
  );
}

function DefaultError({ error, resetErrorBoundary }: FallbackProps) {
  const code = ApiError.is(error) ? error.code : undefined;
  const message = ApiError.is(error) ? error.message : (error as Error).message;
  return (
    <Alert variant="error" title="Something went wrong">
      <Stack gap={2}>
        <span>{message}</span>
        {code && <span className="text-caption text-muted block">code: {code}</span>}
        <div>
          <Button size="sm" onClick={resetErrorBoundary}>
            Try again
          </Button>
        </div>
      </Stack>
    </Alert>
  );
}

/**
 * Composes Suspense + react-error-boundary + TanStack Query's reset behaviour.
 * Use at the page or section level so a single failing query doesn't take down
 * the whole layout.
 */
export function AsyncBoundary({ children, pendingFallback, errorFallback }: AsyncBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();
  return (
    <ErrorBoundary onReset={reset} fallbackRender={errorFallback ?? DefaultError}>
      <React.Suspense fallback={pendingFallback ?? <DefaultPending />}>{children}</React.Suspense>
    </ErrorBoundary>
  );
}

/**
 * Compact empty-state for queries that succeed with no data. Re-uses the
 * design system `EmptyState` so spacing/typography stay consistent.
 */
export function EmptyResult({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <EmptyState
      title={title}
      {...(description ? { description } : {})}
      {...(action ? { action } : {})}
    />
  );
}
