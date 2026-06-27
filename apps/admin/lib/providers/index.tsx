'use client';

import * as React from 'react';
import { ThemeProvider } from '@offisdesign/ui';
import { Toaster, toast } from 'sonner';
import { QueryProvider } from './query.provider';
import { AuthProvider } from './auth.provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export { useAuth } from './auth.provider';
export { toast };
