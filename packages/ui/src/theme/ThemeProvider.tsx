'use client';

import * as React from 'react';
import { theme as defaultTheme, type Theme } from '../tokens';

type ThemeName = 'light';

interface ThemeContextValue {
  theme: Theme;
  name: ThemeName;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: defaultTheme,
  name: 'light',
});

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Reserved for future dark mode; only 'light' is implemented at Stage 3.5b. */
  theme?: ThemeName;
}

export function ThemeProvider({ children, theme: name = 'light' }: ThemeProviderProps) {
  const value = React.useMemo<ThemeContextValue>(() => ({ theme: defaultTheme, name }), [name]);
  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={name} className="font-body text-text bg-background">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}
