import { View } from "react-native";
import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/components/tab-bar";
import { DemoModeSwitch } from "@/components/demo-switch";
import { useTheme } from "@/hooks/use-theme";

function TabContent() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="memory" options={{ title: "Memory" }} />
      <Tabs.Screen name="assistant" options={{ title: "Assistant" }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <TabContent />
      <DemoModeSwitch />
    </View>
  );
}