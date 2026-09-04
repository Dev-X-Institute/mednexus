import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { DemoMode } from "@/utils/predictions-source";

interface DemoContextValue {
  mode: DemoMode;
  setMode: (mode: DemoMode) => void;
  toggle: () => void;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

/**
 * Universal Demo / Live switch. Read via useDemo() anywhere in the tree.
 *  - "demo": curated, deterministic, simulated AI (no network).
 *  - "live": real computation — regression forecasts & Claude narrative.
 */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DemoMode>("demo");

  const value = useMemo<DemoContextValue>(
    () => ({ mode, setMode, toggle: () => setMode((m) => (m === "demo" ? "live" : "demo")) }),
    [mode]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within a DemoProvider");
  return ctx;
}
