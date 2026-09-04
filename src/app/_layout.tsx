import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/constants/theme";
import { SessionProvider } from "@/context/session";
import { DemoProvider } from "@/context/demo";

export default function RootLayout() {
  return (
    <DemoProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.light.background },
          }}
        />
      </SessionProvider>
    </DemoProvider>
  );
}
