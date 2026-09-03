import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#334155",
    textSecondary: "#64748B",
    background: "#F8FAFC",
    backgroundElement: "#E2E8F0",
    backgroundSelected: "#CCFBF1",
    primary: "#0F766E",
    primaryLight: "#99F6E4",
    warning: "#D97706",
    warningLight: "#FEF3C7",
    card: "#FFFFFF",
    border: "#E2E8F0",
    tabActive: "#0F766E",
    tabInactive: "#94A3B8",
  },
  dark: {
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    background: "#0F172A",
    backgroundElement: "#1E293B",
    backgroundSelected: "#134E4A",
    primary: "#2DD4BF",
    primaryLight: "#115E59",
    warning: "#FBBF24",
    warningLight: "#451A03",
    card: "#1E293B",
    border: "#334155",
    tabActive: "#2DD4BF",
    tabInactive: "#64748B",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
