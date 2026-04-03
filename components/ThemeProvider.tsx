'use client';

import { ReactNode } from 'react';
import { ThemeContext, useThemeProvider } from '@/hooks/useTheme';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { dark, toggle, mounted } = useThemeProvider();

  // Prevent flash of wrong theme
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
