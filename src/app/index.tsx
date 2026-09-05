import { Redirect } from "expo-router";
import { useAuth } from "@/context/auth";

export default function IndexScreen() {
  const { isAuthenticated, session } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (session?.audience === "patient") {
    return <Redirect href="/patient/home" />;
  }

  return <Redirect href="/dashboard" />;
}