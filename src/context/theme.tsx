import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Colors, type ThemeColor } from "@/constants/theme";
import { useColorScheme } from "react-native";

type ThemeMode = "light" | "dark" | "system";
type ThemeColors = Record<ThemeColor, string>;

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: "light" | "dark";
  colors: ThemeColors;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const systemScheme = useColorScheme();

  const resolved = useMemo<"light" | "dark">(() => {
    if (mode === "system") return systemScheme === "dark" ? "dark" : "light";
    return mode;
  }, [mode, systemScheme]);

  const colors = useMemo(() => Colors[resolved], [resolved]);

  const toggleTheme = () => {
    setMode((prev) => (prev === "dark" ? "light" : prev === "light" ? "system" : "dark"));
  };

  const value = useMemo(
    () => ({ mode, resolved, colors, toggleTheme, setMode }),
    [mode, resolved, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}