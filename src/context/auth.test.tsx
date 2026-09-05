/**
 * @jest-environment node
 */

import { act, renderHook } from "@testing-library/react-native";
import { AuthProvider, useAuth, useSession } from "@/context/auth";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthContext", () => {
  it("provides unauthenticated state initially", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("signIn sets session and authenticated state", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.signIn("doctor", "Korle Bu Teaching Hospital", "Dr. Test");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.session).toEqual({
      audience: "staff",
      role: "doctor",
      hospital: "Korle Bu Teaching Hospital",
      userName: "Dr. Test",
    });
  });

  it("signInPatient sets a patient-audience session", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.signInPatient("p1", "Ama Boateng");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.session).toEqual({
      audience: "patient",
      patientId: "p1",
      userName: "Ama Boateng",
    });
  });

  it("signOut clears session", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.signIn("doctor", "Korle Bu Teaching Hospital");
    });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.signOut();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.session).toBeNull();
  });

  it("useSession returns session and signIn/signOut", () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.session).toBeNull();

    act(() => {
      result.current.signIn("nurse", "Test Hospital");
    });
    expect(result.current.session?.role).toBe("nurse");
  });

  it("uses default username for role when not provided", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.signIn("pharmacist", "Test Hospital");
    });

    expect(result.current.session?.userName).toBe("Pharm. Abena Mensah");
  });

  it("throws when used outside provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within an AuthProvider");
    consoleError.mockRestore();
  });
});
