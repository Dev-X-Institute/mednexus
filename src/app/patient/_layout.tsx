import { Tabs } from "expo-router";
import { PatientTabBar } from "@/components/patient-tab-bar";
import { useTheme } from "@/hooks/use-theme";

export default function PatientLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <PatientTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="triage" options={{ title: "Symptoms" }} />
      <Tabs.Screen name="hospitals" options={{ title: "Hospitals" }} />
    </Tabs>
  );
}