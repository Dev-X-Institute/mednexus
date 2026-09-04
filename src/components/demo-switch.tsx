import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { useDemo } from "@/context/demo";
import { MODE_LABELS, type DemoMode } from "@/utils/predictions-source";

const c = Colors.light;
const MODES: DemoMode[] = ["demo", "live"];

/**
 * Universal Demo / Live switch. A floating segmented pill rendered above the
 * tab bar so it is reachable from every screen. `useDemo()` drives the whole
 * app — Dashboard forecasts and the Memory AI narrative both react to it.
 */
export function DemoModeSwitch() {
  const { mode, setMode } = useDemo();
  return (
    <View style={styles.shell} pointerEvents="box-none">
      <View style={styles.pill}>
        {MODES.map((m) => {
          const active = mode === m;
          return (
            <Pressable key={m} onPress={() => setMode(m)} style={[styles.btn, active && styles.active]}>
              <Ionicons
                name={active ? "pulse" : "pulse-outline"}
                size={12}
                color={active ? "#FFFFFF" : c.textSecondary}
              />
              <Text style={[styles.label, active && styles.activeLabel]}>{MODE_LABELS[m].label}</Text>
            </Pressable>
          );
        })}
        <View style={styles.dot} />
        <Text style={styles.caption}>{MODE_LABELS[mode].note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 180,
    alignItems: "center",
    zIndex: 50,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: Radii.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    paddingHorizontal: Spacing.two,
    maxWidth: "90%",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
  },
  active: { backgroundColor: c.primary },
  activeLabel: { color: "#FFFFFF" },
  label: { fontSize: 11, fontWeight: "700", color: c.textSecondary },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: c.border, marginHorizontal: Spacing.one },
  caption: { fontSize: 10, color: c.textMuted, fontWeight: "500" },
});
