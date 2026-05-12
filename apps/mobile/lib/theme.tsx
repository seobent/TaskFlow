import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemeMode = "light" | "dark";

export type ThemeColors = {
  background: string;
  border: string;
  card: string;
  danger: string;
  dangerBackground: string;
  dangerBorder: string;
  input: string;
  muted: string;
  mutedStrong: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  primarySoftPressed: string;
  text: string;
  textOnPrimary: string;
};

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  toggleMode: () => void;
};

const STORAGE_KEY = "taskflow_theme";

const lightColors: ThemeColors = {
  background: "#f7f8fb",
  border: "rgba(23, 32, 51, 0.12)",
  card: "#ffffff",
  danger: "#9a2d22",
  dangerBackground: "#fff2f1",
  dangerBorder: "#f0b7b2",
  input: "#ffffff",
  muted: "#566176",
  mutedStrong: "#2f7368",
  primary: "#2f9f89",
  primaryPressed: "#257f6e",
  primarySoft: "#e8f5f2",
  primarySoftPressed: "#d7eee9",
  text: "#172033",
  textOnPrimary: "#ffffff",
};

const darkColors: ThemeColors = {
  background: "#0b101b",
  border: "rgba(232, 238, 246, 0.14)",
  card: "#121927",
  danger: "#ffb4a9",
  dangerBackground: "rgba(154, 45, 34, 0.18)",
  dangerBorder: "rgba(255, 180, 169, 0.28)",
  input: "#0f1724",
  muted: "#a3adbd",
  mutedStrong: "#68d3b8",
  primary: "#68d3b8",
  primaryPressed: "#4ebaa0",
  primarySoft: "rgba(104, 211, 184, 0.14)",
  primarySoftPressed: "rgba(104, 211, 184, 0.22)",
  text: "#e8eef6",
  textOnPrimary: "#071719",
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() =>
    Appearance.getColorScheme() === "dark" ? "dark" : "light",
  );
  const [hasLoadedStoredMode, setHasLoadedStoredMode] = useState(false);

  useEffect(() => {
    let isMounted = true;

    SecureStore.getItemAsync(STORAGE_KEY).then((storedMode) => {
      if (!isMounted) {
        return;
      }

      if (storedMode === "light" || storedMode === "dark") {
        setMode(storedMode);
      }

      setHasLoadedStoredMode(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (hasLoadedStoredMode) {
      void SecureStore.setItemAsync(STORAGE_KEY, mode);
    }
  }, [hasLoadedStoredMode, mode]);

  const value = useMemo(
    () => ({
      colors: mode === "dark" ? darkColors : lightColors,
      isDark: mode === "dark",
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
