import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "@/context/theme";
import { AuthProvider, useAuth } from "@/context/auth";
import { DemoProvider } from "@/context/demo";
import { DataProvider } from "@/context/data";
import { AccessibilityProvider } from "@/context/accessibility";

function RootStack() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
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

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DemoProvider>
          <DataProvider>
            <AccessibilityProvider>
              <StatusBar style="dark" />
              <AuthGate />
            </AccessibilityProvider>
          </DataProvider>
        </DemoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}