'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface ThemeContextValue {
  dark: boolean;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({ dark: true, toggle: () => {} });

export function useThemeProvider() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    // Update meta theme-color for iOS
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#000000' : '#F2F2F7');
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setDark(d => {
      const newVal = !d;
      document.documentElement.classList.toggle('dark', newVal);
      localStorage.setItem('theme', newVal ? 'dark' : 'light');
      // Update meta theme-color for iOS
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', newVal ? '#000000' : '#F2F2F7');
      return newVal;
    });
  }, []);

  return { dark, toggle, mounted };
}

export function useTheme() {
  return useContext(ThemeContext);
}
