/**
 * @jest-environment node
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { DemoProvider, useDemo } from "@/context/demo";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DemoProvider>{children}</DemoProvider>
);

describe("DemoContext", () => {
  it("provides default demo mode", () => {
    const { result } = renderHook(() => useDemo(), { wrapper });
    expect(result.current.mode).toBe("demo");
  });

  it("toggles mode", () => {
    const { result } = renderHook(() => useDemo(), { wrapper });

    act(() => {
      result.current.toggle();
    });
    expect(result.current.mode).toBe("live");

    act(() => {
      result.current.toggle();
    });
    expect(result.current.mode).toBe("demo");
  });

  it("setMode updates mode directly", () => {
    const { result } = renderHook(() => useDemo(), { wrapper });

    act(() => {
      result.current.setMode("live");
    });
    expect(result.current.mode).toBe("live");
  });

  it("throws when used outside provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useDemo())).toThrow("useDemo must be used within a DemoProvider");
    consoleError.mockRestore();
  });
});