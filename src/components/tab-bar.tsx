import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const ICONS: Record<string, [string, string]> = {
  dashboard: ["grid-outline", "grid"],
  memory: ["library-outline", "library"],
  assistant: ["chatbubble-ellipses-outline", "chatbubble-ellipses"],
  analytics: ["stats-chart-outline", "stats-chart"],
  more: ["ellipsis-horizontal-outline", "ellipsis-horizontal"],
};

const TAB_BADGE = 3;

function TabBarItem({
  name,
  active,
  onPress,
}: {
  name: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors: c } = useTheme();
  const [outline, filled] = ICONS[name];
  return (
    <Pressable onPress={onPress} style={styles.item} hitSlop={6}>
      {name === "more" && TAB_BADGE > 0 ? (
        <View style={styles.badgeWrap}>
          <View style={styles.badgeDot} />
        </View>
      ) : null}
      <Ionicons
        name={active ? (filled as any) : (outline as any)}
        size={22}
        color={active ? c.primary : c.tabInactive}
      />
      <Text style={[styles.label, { color: active ? c.text : c.tabInactive }]} numberOfLines={1}>
        {name === "memory" ? "Memory" : name.charAt(0).toUpperCase() + name.slice(1)}
      </Text>
    </Pressable>
  );
}

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: {
  state: any;
  descriptors: any;
  navigation: any;
}) {
  const { colors: c } = useTheme();
  return (
    <View style={styles.shell} pointerEvents="box-none">
      <GlassView glassEffectStyle="regular" tintColor={c.cardElevated} style={styles.pill}>
        {state.routes.map((route: any, i: number) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === i;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
          return (
            <TabBarItem
              key={route.key}
              name={label.toLowerCase().replace(" ", "")}
              active={isFocused}
              onPress={onPress}
            />
          );
        })}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: Spacing.two,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: Spacing.one,
  },
  label: { fontSize: 10, fontWeight: "600" },
  badgeWrap: { position: "absolute", top: 0, right: "28%", zIndex: 10 },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F87171",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
});
