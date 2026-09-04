import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DemoMode } from "@/utils/predictions-source";
import { storageGet, storageSet } from "@/utils/storage";

const STORAGE_KEY = "demoMode";

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
 *
 * The chosen mode is persisted locally (native + web) so it survives reloads.
 */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DemoMode>("demo");
  const hydrated = useRef(false);

  // Load the saved mode once on mount (async — runs after the initial render).
  useEffect(() => {
    storageGet(STORAGE_KEY).then((saved) => {
      if (saved === "demo" || saved === "live") {
        hydrated.current = true;
        setMode(saved);
      }
    });
  }, []);

  // Persist whenever the user changes the mode (never on initial hydration).
  const applyMode = useCallback((next: DemoMode) => {
    setMode(next);
    if (hydrated.current) storageSet(STORAGE_KEY, next);
  }, []);

  const toggle = useCallback(
    () => applyMode(mode === "demo" ? "live" : "demo"),
    [applyMode, mode]
  );

  const value = useMemo<DemoContextValue>(
    () => ({ mode, setMode: applyMode, toggle }),
    [mode, applyMode, toggle]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within a DemoProvider");
  return ctx;
}
