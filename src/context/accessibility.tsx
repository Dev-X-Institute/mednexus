import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AccessibilityInfo } from "react-native";

interface AccessibilityContextValue {
  reduceMotion: boolean;
  screenReaderEnabled: boolean;
  boldTextEnabled: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [boldTextEnabled, setBoldTextEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderEnabled);
    AccessibilityInfo.isBoldTextEnabled().then(setBoldTextEnabled);

    const reduceMotionListener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );
    const screenReaderListener = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setScreenReaderEnabled
    );
    const boldTextListener = AccessibilityInfo.addEventListener(
      "boldTextChanged",
      setBoldTextEnabled
    );

    return () => {
      reduceMotionListener.remove();
      screenReaderListener.remove();
      boldTextListener.remove();
    };
  }, []);

  const value = useMemo(
    () => ({ reduceMotion, screenReaderEnabled, boldTextEnabled }),
    [reduceMotion, screenReaderEnabled, boldTextEnabled]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within an AccessibilityProvider");
  return ctx;
}