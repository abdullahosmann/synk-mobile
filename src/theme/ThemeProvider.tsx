import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";
import { colorScheme as nwColorScheme } from "nativewind";
import { getItem, setItem, KEY_THEME } from "../lib/storage";
import { darkColors, lightColors, Palette } from "./colors";

type ThemeName = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
  colors: Palette;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveInitialTheme(): ThemeName {
  const saved = getItem(KEY_THEME);
  if (saved === "light" || saved === "dark") return saved;
  // Mirror the web: fall back to the OS preference.
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeName>(() =>
    resolveInitialTheme(),
  );

  // Keep NativeWind's `dark:` variant engine in sync with our theme.
  useEffect(() => {
    nwColorScheme.set(theme);
  }, [theme]);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    setItem(KEY_THEME, t);
    nwColorScheme.set(t);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
      colors: theme === "dark" ? darkColors : lightColors,
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

/** Convenience: just the active palette. */
export function useColors(): Palette {
  return useTheme().colors;
}
