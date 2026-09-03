import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Gradients, Radii, Spacing } from "@/constants/theme";
import { useSession } from "@/context/session";
import type { RoleId } from "@/utils/types";

const ROLES: { id: RoleId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "admin", label: "Administrator", icon: "shield-checkmark-outline" },
  { id: "doctor", label: "Doctor", icon: "medkit-outline" },
  { id: "nurse", label: "Nurse", icon: "bandage-outline" },
  { id: "pharmacist", label: "Pharmacist", icon: "medical-outline" },
  { id: "lab_scientist", label: "Lab Scientist", icon: "flask-outline" },
  { id: "finance_officer", label: "Finance Officer", icon: "card-outline" },
];

const HOSPITALS = [
  { name: "St. Meridian General", loc: "Houston, TX" },
  { name: "Lakeside Regional", loc: "Seattle, WA" },
  { name: "Central City Med", loc: "Chicago, IL" },
];

export default function LoginScreen() {
  const c = Colors.light;
  const router = useRouter();
  const { signIn } = useSession();
  const { width } = useWindowDimensions();

  const [role, setRole] = useState<RoleId | null>(null);
  const [hospital, setHospital] = useState(HOSPITALS[0].name);

  const submit = () => {
    signIn(role ?? "doctor", hospital, "Daniel Chen");
    router.replace("/(tabs)/dashboard");
  };

  const roleChips = 3;

  return (
    <LinearGradient colors={Gradients.header} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Ionicons name="pulse-outline" size={20} color={Colors.light.primary} />
            </View>
            <Text style={[styles.brandName, { color: c.text }]}>MedNexus AI</Text>
          </View>

          <View style={styles.heading}>
            <Text style={[styles.title, { color: c.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Sign in to your hospital command center
            </Text>
          </View>

          {/* Role selector */}
          <Text style={[styles.label, { color: c.textSecondary }]}>Select role</Text>
          <View style={styles.roleGrid}>
            {ROLES.map((r, i) => {
              const inLastRow = i >= ROLES.length - (ROLES.length % roleChips || roleChips);
              const selected = role === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  activeOpacity={0.85}
                  onPress={() => setRole(r.id)}
                  style={[
                    styles.roleChip,
                    { width: (width - Spacing.four * 2 - Spacing.two * (roleChips - 1)) / roleChips },
                    inLastRow && styles.roleChipLastRow,
                    selected && { borderColor: c.primary, backgroundColor: c.cardElevated },
                  ]}
                >
                  <Ionicons name={r.icon} size={20} color={selected ? c.primary : c.textSecondary} />
                  <Text style={[styles.roleLabel, { color: selected ? c.text : c.textSecondary }]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hospital picker */}
          <Text style={[styles.label, { color: c.textSecondary }]}>Hospital workspace</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hospitalRow}
          >
            {HOSPITALS.map((h) => {
              const selected = hospital === h.name;
              return (
                <Pressable
                  key={h.name}
                  onPress={() => setHospital(h.name)}
                  style={[styles.hospitalCard, selected && { borderColor: c.primary }]}
                >
                  <Ionicons
                    name="business-outline"
                    size={18}
                    color={selected ? c.primary : c.textSecondary}
                  />
                  <View style={styles.hospitalText}>
                    <Text style={[styles.hospitalName, { color: selected ? c.text : c.textSecondary }]}>
                      {h.name}
                    </Text>
                    <Text style={[styles.hospitalLoc, { color: c.textMuted }]}>{h.loc}</Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={16} color={c.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Sign in */}
          <TouchableOpacity activeOpacity={0.9} onPress={submit} style={styles.primaryBtn}>
            <View style={styles.primaryBtnGradient}>
              <Text style={styles.primaryBtnText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={submit}
            style={[styles.faceIdBtn, { borderColor: c.border }]}
          >
            <Ionicons name="scan-outline" size={18} color={c.text} />
            <Text style={[styles.faceIdText, { color: c.text }]}>Sign in with Face ID</Text>
          </TouchableOpacity>

          <Text style={[styles.footnote, { color: c.textMuted }]}>
            Secure, role-based access · All data is simulated
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: Spacing.five },
  brandRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(20,184,166,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
  heading: { marginTop: Spacing.five, marginBottom: Spacing.four },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: Spacing.one },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.two,
    marginTop: Spacing.three,
  },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  roleChip: {
    height: 84,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  roleChipLastRow: { marginBottom: 0 },
  roleLabel: { fontSize: 12, fontWeight: "600" },
  hospitalRow: { gap: Spacing.two },
  hospitalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    borderRadius: Radii.lg,
    padding: Spacing.three,
    minWidth: 210,
  },
  hospitalText: { flex: 1 },
  hospitalName: { fontSize: 13, fontWeight: "600" },
  hospitalLoc: { fontSize: 11, marginTop: 2 },
  primaryBtn: { marginTop: Spacing.five, borderRadius: Radii.md },
  primaryBtnGradient: {
    height: 50,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  faceIdBtn: {
    marginTop: Spacing.three,
    height: 50,
    borderRadius: Radii.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  faceIdText: { fontSize: 15, fontWeight: "600" },
  footnote: { textAlign: "center", fontSize: 12, marginTop: Spacing.five },
});
