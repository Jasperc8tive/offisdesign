'use client';

import * as React from 'react';
import { ThemeProvider } from '@offisdesign/ui';
import { Toaster, toast } from 'sonner';
import { QueryProvider } from './query.provider';
import { AuthProvider } from './auth.provider';
import { GlobalErrorBoundary } from '../../components/error-boundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GlobalErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </GlobalErrorBoundary>
  );
}

export { useAuth } from './auth.provider';
export { toast };
