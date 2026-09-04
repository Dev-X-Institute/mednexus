import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Alert } from "react-native";
import type { Session, RoleId } from "@/utils/types";

interface AuthContextValue extends SessionContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface SessionContextValue {
  session: Session | null;
  signIn: (role: RoleId, hospital: string, userName: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_HOSPITALS: Record<RoleId, string[]> = {
  admin: ["Korle Bu Teaching Hospital", "Komfo Anokye Teaching Hospital", "All Facilities"],
  doctor: ["Korle Bu Teaching Hospital", "Komfo Anokye Teaching Hospital"],
  nurse: ["Korle Bu Teaching Hospital", "Komfo Anokye Teaching Hospital"],
  pharmacist: ["Korle Bu Teaching Hospital"],
  lab_scientist: ["Korle Bu Teaching Hospital", "Komfo Anokye Teaching Hospital"],
  finance_officer: ["Korle Bu Teaching Hospital"],
};

const DEFAULT_USERS: Record<RoleId, string> = {
  admin: "System Administrator",
  doctor: "Dr. Ama Osei",
  nurse: "Nurse Kwame Asante",
  pharmacist: "Pharm. Abena Mensah",
  lab_scientist: "Dr. Kofi Boateng",
  finance_officer: "Ms. Efua Nkrumah",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = (role: RoleId, hospital: string, userName?: string) => {
    setSession({
      role,
      hospital,
      userName: userName ?? DEFAULT_USERS[role],
    });
  };

  const signOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => setSession(null) },
    ]);
  };

  const value = useMemo(
    () => ({
      session,
      signIn,
      signOut,
      isAuthenticated: !!session,
      isLoading,
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function useSession(): SessionContextValue {
  const { session, signIn, signOut } = useAuth();
  return { session, signIn, signOut };
}

export { ROLE_HOSPITALS, DEFAULT_USERS };
export type { RoleId } from "@/utils/types";