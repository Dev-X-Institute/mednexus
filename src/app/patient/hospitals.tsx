import { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { Spacing, Radii } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useCare } from "@/context/care";
import { Card, Badge, ProgressBar } from "@/components/ui";
import type { Hospital, HospitalStatus } from "@/utils/types";

const STATUS_ORDER: Record<HospitalStatus, number> = { Available: 0, Limited: 1, Full: 2 };

export default function PatientHospitalsScreen() {
  const { colors: c } = useTheme();
  const { hospitals } = useCare();

  const statusColor = (s: HospitalStatus) =>
    s === "Available" ? c.success : s === "Limited" ? c.warning : c.critical;
  const statusTone = (s: HospitalStatus): "success" | "warning" | "critical" =>
    s === "Available" ? "success" : s === "Limited" ? "warning" : "critical";

  // Available first, then Limited, then Full; within a group, nearest first.
  const sorted = useMemo(
    () =>
      [...hospitals].sort(
        (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.distanceKm - b.distanceKm
      ),
    [hospitals]
  );

  const call = (phone: string) => {
    const num = phone.replace(/[^+\d]/g, "");
    Linking.openURL(`tel:${num}`).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.note}>
          <Ionicons name="swap-vertical" size={14} color={c.textMuted} />
          <Text style={[styles.noteText, { color: c.textSecondary }]}>
            Sorted by availability, then distance. Bed counts update live as facilities report.
          </Text>
        </View>

        {sorted.map((h) => (
          <HospitalCard
            key={h.id}
            hospital={h}
            color={statusColor(h.status)}
            tone={statusTone(h.status)}
            onCall={() => call(h.phone)}
          />
        ))}

        <View style={[styles.disclaimer, { borderColor: c.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={c.info} />
          <Text style={[styles.disclaimerText, { color: c.textMuted }]}>
            Availability shown is simulated demo data. A production build would pull live bed counts
            from a facility registry (e.g. Ghana&apos;s HeFRA) or each hospital&apos;s system.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HospitalCard({
  hospital: h,
  color,
  tone,
  onCall,
}: {
  hospital: Hospital;
  color: string;
  tone: "success" | "warning" | "critical";
  onCall: () => void;
}) {
  const { colors: c } = useTheme();
  const isFull = h.status === "Full";

  return (
    <Card style={[styles.card, isFull && { opacity: 0.6 }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: c.text }]}>{h.name}</Text>
          <Text style={[styles.address, { color: c.textSecondary }]}>{h.address}</Text>
        </View>
        <Badge label={h.status} tone={tone} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="navigate-outline" size={14} color={c.textMuted} />
          <Text style={[styles.metaText, { color: c.textSecondary }]}>
            {h.distanceKm.toFixed(1)} km away
          </Text>
        </View>
      </View>

      <ProgressBar
        label={isFull ? "No beds available" : "Beds available"}
        valueLabel={`${h.availableBeds} of ${h.totalBeds}`}
        progress={h.totalBeds > 0 ? h.availableBeds / h.totalBeds : 0}
        color={color}
        style={{ marginTop: Spacing.two }}
      />

      <TouchableOpacity
        onPress={onCall}
        style={[styles.callBtn, { borderColor: c.border }]}
        accessibilityRole="button"
        accessibilityLabel={`Call ${h.name}`}
      >
        <Ionicons name="call-outline" size={16} color={c.primary} />
        <Text style={[styles.callText, { color: c.primary }]}>{h.phone}</Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },

  note: { flexDirection: "row", alignItems: "center", gap: Spacing.two, paddingHorizontal: Spacing.one },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17 },

  card: { gap: Spacing.two },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.two },
  name: { fontSize: 17, fontWeight: "700" },
  address: { fontSize: 13, marginTop: 2 },

  metaRow: { flexDirection: "row", gap: Spacing.three },
  metaItem: { flexDirection: "row", alignItems: "center", gap: Spacing.one },
  metaText: { fontSize: 13 },

  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  callText: { fontSize: 14, fontWeight: "700" },

  disclaimer: {
    flexDirection: "row",
    gap: Spacing.two,
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
