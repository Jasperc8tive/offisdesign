'use client';

import * as React from 'react';
import { Alert, Button, Stack } from '@offisdesign/ui';
import { reportError } from '../lib/observability/error-reporter';

interface Props {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface State {
  error: Error | null;
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    reportError(error, {
      tags: { boundary: 'global' },
      extra: { componentStack: info.componentStack },
    });
  }

  reset = (): void => this.setState({ error: null });

  override render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
    return (
      <Stack gap={4} className="p-6">
        <Alert variant="error" title="Something went wrong">
          <Stack gap={3}>
            <span>{this.state.error.message}</span>
            <div>
              <Button size="sm" onClick={this.reset}>
                Try again
              </Button>
            </div>
          </Stack>
        </Alert>
      </Stack>
    );
  }
}
