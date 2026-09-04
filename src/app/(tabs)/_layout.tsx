import { View } from "react-native";
import { Tabs } from "expo-router";
import { Colors } from "@/constants/theme";
import { FloatingTabBar } from "@/components/tab-bar";
import { DemoModeSwitch } from "@/components/demo-switch";

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: Colors.light.background },
        }}
      >
        <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
        <Tabs.Screen name="memory" options={{ title: "Memory" }} />
        <Tabs.Screen name="assistant" options={{ title: "Assistant" }} />
        <Tabs.Screen name="analytics" options={{ title: "Analytics" }} />
        <Tabs.Screen name="more" options={{ title: "More" }} />
      </Tabs>
      <DemoModeSwitch />
    </View>
  );
}
