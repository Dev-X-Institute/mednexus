import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "@/context/theme";
import { AuthProvider, useAuth } from "@/context/auth";
import { DemoProvider } from "@/context/demo";
import { DataProvider } from "@/context/data";
import { CareProvider } from "@/context/care";
import { AccessibilityProvider } from "@/context/accessibility";

function AuthGate() {
  const { isAuthenticated, session } = useAuth();
  const { colors } = useTheme();

  // Themed native header for pushed detail screens (roster, network).
  const headerScreenOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.primary,
    headerTitleStyle: { color: colors.text },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
  } as const;

  if (!isAuthenticated) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)/login" />
      </Stack>
    );
  }

  if (session?.audience === "patient") {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="patient" />
      </Stack>
    );
  }

  // Staff: tab shell + pushable detail screens.
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="roster/index" options={{ ...headerScreenOptions, title: "My Patients" }} />
      <Stack.Screen name="roster/[id]" options={{ ...headerScreenOptions, title: "Patient" }} />
      <Stack.Screen name="network" options={{ ...headerScreenOptions, title: "Hospital Network" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DemoProvider>
          <DataProvider>
            <CareProvider>
              <AccessibilityProvider>
                <StatusBar style="dark" />
                <AuthGate />
              </AccessibilityProvider>
            </CareProvider>
          </DataProvider>
        </DemoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
