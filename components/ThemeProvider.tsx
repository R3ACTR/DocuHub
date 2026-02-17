"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_THEME,
  resolveStoredTheme,
  THEMES,
  THEME_CONTRAST_AUDIT,
  THEME_STORAGE_KEY,
  type ThemeName,
} from "@/lib/themes";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const applyTheme = (theme: ThemeName) => {
  const root = document.documentElement;
  const tokens = THEMES[theme];

  root.setAttribute("data-theme", theme);
  root.style.setProperty("--theme-background", tokens.background);
  root.style.setProperty("--theme-surface", tokens.surface);
  root.style.setProperty("--theme-text", tokens.text);
  root.style.setProperty("--theme-muted-text", tokens.mutedText);
  root.style.setProperty("--theme-border", tokens.border);
  root.style.setProperty("--theme-primary", tokens.primary);
  root.style.setProperty("--theme-primary-foreground", tokens.primaryForeground);
  root.style.setProperty("--theme-accent", tokens.accent);
  root.style.setProperty("--theme-accent-foreground", tokens.accentForeground);
  root.style.setProperty("--theme-success", tokens.success);
  root.style.setProperty("--theme-danger", tokens.danger);
  root.style.colorScheme = tokens.mode;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = resolveStoredTheme(savedTheme);
    applyTheme(initialTheme);
    setThemeState(initialTheme);
  }, []);

  useEffect(() => {
    for (const [name, audit] of Object.entries(THEME_CONTRAST_AUDIT)) {
      if (!audit.pass) {
        console.warn(`Theme "${name}" failed contrast checks`, audit.checks);
      }
    }
  }, []);

  const setTheme = (nextTheme: ThemeName) => {
    setThemeState(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  const resetTheme = () => {
    setTheme(DEFAULT_THEME);
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resetTheme,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
