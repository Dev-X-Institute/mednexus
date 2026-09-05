import { Stack } from "expo-router";
import { useTheme } from "@/hooks/use-theme";

export default function PatientLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      initialRouteName="home"
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* Patient home draws its own header (greeting + sign out). */}
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="hospitals" options={{ title: "Hospitals Near You" }} />
      {/* triage.tsx is built by opencode; its route + header live here. */}
      <Stack.Screen name="triage" options={{ title: "Check Your Symptoms" }} />
    </Stack>
  );
}
