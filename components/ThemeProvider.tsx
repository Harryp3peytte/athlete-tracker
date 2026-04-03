'use client';

import { ReactNode } from 'react';
import { ThemeContext } from '@/hooks/useTheme';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ dark: false, toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}
