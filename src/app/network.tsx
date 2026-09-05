import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { Spacing, Radii } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useCare } from "@/context/care";
import { Card, Badge, ProgressBar } from "@/components/ui";
import type { HospitalStatus } from "@/utils/types";

export default function NetworkScreen() {
  const { colors: c } = useTheme();
  const { hospitals, updateHospitalBeds } = useCare();

  const statusColor = (s: HospitalStatus) =>
    s === "Available" ? c.success : s === "Limited" ? c.warning : c.critical;
  const statusTone = (s: HospitalStatus): "success" | "warning" | "critical" =>
    s === "Available" ? "success" : s === "Limited" ? "warning" : "critical";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.note}>
          <Ionicons name="sync" size={14} color={c.info} />
          <Text style={[styles.noteText, { color: c.textSecondary }]}>
            Adjust live bed counts as capacity changes. Updates appear instantly in every patient&apos;s
            &ldquo;Find a Hospital&rdquo; view.
          </Text>
        </View>

        {hospitals.map((h) => (
          <Card key={h.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.text }]}>{h.name}</Text>
                <Text style={[styles.address, { color: c.textSecondary }]}>{h.address}</Text>
              </View>
              <Badge label={h.status} tone={statusTone(h.status)} />
            </View>

            <ProgressBar
              label="Beds available"
              valueLabel={`${h.availableBeds} / ${h.totalBeds}`}
              progress={h.totalBeds > 0 ? h.availableBeds / h.totalBeds : 0}
              color={statusColor(h.status)}
              style={{ marginTop: Spacing.one }}
            />

            <View style={styles.stepper}>
              <StepButton
                icon="remove"
                disabled={h.availableBeds <= 0}
                onPress={() => updateHospitalBeds(h.id, h.availableBeds - 1)}
              />
              <View style={styles.stepValue}>
                <Text style={[styles.stepNumber, { color: c.text }]}>{h.availableBeds}</Text>
                <Text style={[styles.stepUnit, { color: c.textMuted }]}>beds open</Text>
              </View>
              <StepButton
                icon="add"
                disabled={h.availableBeds >= h.totalBeds}
                onPress={() => updateHospitalBeds(h.id, h.availableBeds + 1)}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StepButton({
  icon,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors: c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.stepBtn,
        {
          backgroundColor: c.backgroundElement,
          borderColor: c.border,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={22} color={c.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },

  note: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.two, paddingHorizontal: Spacing.one },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17 },

  card: { gap: Spacing.two },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.two },
  name: { fontSize: 17, fontWeight: "700" },
  address: { fontSize: 13, marginTop: 2 },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.one,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: { alignItems: "center" },
  stepNumber: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  stepUnit: { fontSize: 11, marginTop: 1 },
});
