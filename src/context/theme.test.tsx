/**
 * @jest-environment node
 */

import { act, renderHook } from "@testing-library/react-native";
import { ThemeProvider, useTheme } from "@/context/theme";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe("ThemeContext", () => {
  it("provides default system mode", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe("system");
    expect(result.current.resolved).toBe("light");
  });

  it("toggles theme correctly: system -> dark -> light -> system", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.mode).toBe("dark");
    expect(result.current.resolved).toBe("dark");

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.mode).toBe("light");
    expect(result.current.resolved).toBe("light");

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.mode).toBe("system");
  });

  it("setMode updates mode directly", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setMode("dark");
    });
    expect(result.current.mode).toBe("dark");
    expect(result.current.resolved).toBe("dark");

    act(() => {
      result.current.setMode("light");
    });
    expect(result.current.mode).toBe("light");
    expect(result.current.resolved).toBe("light");
  });

  it("returns correct colors for resolved theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setMode("dark");
    });
    expect(result.current.colors.background).toBe("#0A0E1A");

    act(() => {
      result.current.setMode("light");
    });
    expect(result.current.colors.background).toBe("#F7F9FC");
  });

  it("throws when used outside provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow("useTheme must be used within a ThemeProvider");
    consoleError.mockRestore();
  });
});