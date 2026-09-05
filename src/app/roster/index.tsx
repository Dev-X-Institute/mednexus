import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Spacing, Radii } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useCare } from "@/context/care";
import { Card, Badge } from "@/components/ui";

export default function RosterScreen() {
  const { colors: c } = useTheme();
  const router = useRouter();
  const { patients, getPrescriptions, getDiagnoses } = useCare();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.count, { color: c.textSecondary }]}>
          {patients.length} patient{patients.length === 1 ? "" : "s"} under your care
        </Text>

        {patients.map((p) => {
          const rxCount = getPrescriptions(p.id).length;
          const dxCount = getDiagnoses(p.id).length;
          const hasAllergies = p.allergies.length > 0;
          return (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: "/roster/[id]", params: { id: p.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Open ${p.name}`}
            >
              {({ pressed }) => (
                <Card style={[styles.card, pressed && { opacity: 0.85 }]}>
                  <View style={[styles.avatar, { backgroundColor: c.backgroundElement }]}>
                    <Ionicons name="person" size={22} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.name, { color: c.text }]}>{p.name}</Text>
                      {hasAllergies && <Badge label="Allergy" tone="critical" />}
                    </View>
                    <Text style={[styles.meta, { color: c.textSecondary }]}>
                      {p.age} · {p.gender} · {p.bloodGroup}
                    </Text>
                    <Text style={[styles.sub, { color: c.textMuted }]}>
                      {p.conditions.length > 0 ? p.conditions.join(", ") : "No active conditions"}
                    </Text>
                    <View style={styles.chips}>
                      <Text style={[styles.chip, { color: c.textSecondary, borderColor: c.border }]}>
                        {dxCount} diagnos{dxCount === 1 ? "is" : "es"}
                      </Text>
                      <Text style={[styles.chip, { color: c.textSecondary, borderColor: c.border }]}>
                        {rxCount} prescription{rxCount === 1 ? "" : "s"}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
                </Card>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.two },
  count: { fontSize: 13, marginBottom: Spacing.one, paddingHorizontal: Spacing.one },

  card: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  name: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  sub: { fontSize: 13, marginTop: 4 },
  chips: { flexDirection: "row", gap: Spacing.one, marginTop: Spacing.two },
  chip: {
    fontSize: 11,
    fontWeight: "600",
    borderWidth: 1,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    overflow: "hidden",
  },
});
