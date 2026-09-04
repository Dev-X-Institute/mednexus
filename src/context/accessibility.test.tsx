/**
 * @jest-environment node
 */

import { renderHook } from "@testing-library/react-native";
import { AccessibilityProvider, useAccessibility } from "@/context/accessibility";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AccessibilityProvider>{children}</AccessibilityProvider>
);

describe("AccessibilityContext", () => {
  it("provides default values", () => {
    const { result } = renderHook(() => useAccessibility(), { wrapper });
    expect(result.current.reduceMotion).toBe(false);
    expect(result.current.screenReaderEnabled).toBe(false);
    expect(result.current.boldTextEnabled).toBe(false);
  });

  it("throws when used outside provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAccessibility())).toThrow(
      "useAccessibility must be used within an AccessibilityProvider"
    );
    consoleError.mockRestore();
  });
});
