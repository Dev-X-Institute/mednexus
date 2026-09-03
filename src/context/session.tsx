import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Session, RoleId } from "@/utils/types";

interface SessionContextValue {
  session: Session | null;
  signIn: (role: RoleId, hospital: string, userName: string) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const value = useMemo(
    () => ({
      session,
      signIn: (role: RoleId, hospital: string, userName: string) =>
        setSession({ role, hospital, userName }),
      signOut: () => setSession(null),
    }),
    [session]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
