import { Platform } from "react-native";

/**
 * MedNexus AI — dark-first navy + blue design system.
 * Design targets dark mode; a sensible light variant is provided for completeness.
 */
export const Colors = {
  dark: {
    background: "#0A0E1A",
    backgroundDim: "#0D1220",
    card: "#131A2A",
    cardElevated: "#182033",
    backgroundElement: "#182033",
    border: "#1E293B",
    primary: "#38BDF8",
    primaryDim: "#0EA5E9",
    gradientStart: "#38BDF8",
    gradientMid: "#3B82F6",
    gradientEnd: "#2563EB",
    accent: "#38BDF8",
    success: "#34D399",
    warning: "#FBBF24",
    critical: "#F87171",
    info: "#A78BFA",
    confidence: "#A78BFA",
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    tabActive: "#38BDF8",
    tabInactive: "#64748B",
    glass: "rgba(19, 26, 42, 0.72)",
  },
  light: {
    background: "#F7F9FC",
    backgroundDim: "#EEF1F6",
    card: "#FFFFFF",
    cardElevated: "#FFFFFF",
    backgroundElement: "#FFFFFF",
    border: "#E6EAF2",
    primary: "#2F6FED",
    primaryDim: "#5A8CF2",
    gradientStart: "#14B8A6",
    gradientMid: "#2F8FE0",
    gradientEnd: "#2F6FED",
    accent: "#14B8A6",
    success: "#16A34A",
    warning: "#D97706",
    critical: "#DC2626",
    info: "#7C3AED",
    confidence: "#7C3AED",
    text: "#101828",
    textSecondary: "#667085",
    textMuted: "#94A3B8",
    tabActive: "#2F6FED",
    tabInactive: "#94A3B8",
    glass: "rgba(255, 255, 255, 0.75)",
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Gradients = {
  primary: ["#14B8A6", "#2F8FE0", "#2F6FED"] as const,
  header: ["#F7F9FC", "#EEF1F6"] as const,
};

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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
