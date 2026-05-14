"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  toggleMode: () => void;
};

const STORAGE_KEY = "taskflow_theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [hasLoadedStoredMode, setHasLoadedStoredMode] = useState(false);

  useEffect(() => {
    const storedMode = window.localStorage.getItem(STORAGE_KEY);

    if (storedMode === "light" || storedMode === "dark") {
      setMode(storedMode);
      setHasLoadedStoredMode(true);
      return;
    }

    setMode(
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    );
    setHasLoadedStoredMode(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.style.colorScheme = mode;

    if (hasLoadedStoredMode) {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [hasLoadedStoredMode, mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleMode: () =>
        setMode((currentMode) => (currentMode === "dark" ? "light" : "dark")),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
