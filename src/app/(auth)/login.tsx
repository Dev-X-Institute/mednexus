import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing, Radii } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth, ROLE_HOSPITALS, DEFAULT_USERS } from "@/context/auth";
import { Card, GradientButton, Badge, SectionHeader } from "@/components/ui";

const ROLES = [
  { id: "admin" as const, label: "Administrator", icon: "shield-checkmark", color: "#6366F1", desc: "Full system access" },
  { id: "doctor" as const, label: "Doctor", icon: "medical", color: "#EF4444", desc: "Patient care & orders" },
  { id: "nurse" as const, label: "Nurse", icon: "heart", color: "#EC4899", desc: "Vitals & medication admin" },
  { id: "pharmacist" as const, label: "Pharmacist", icon: "medkit", color: "#14B8A6", desc: "Inventory & prescriptions" },
  { id: "lab_scientist" as const, label: "Lab Scientist", icon: "flask", color: "#F59E0B", desc: "Lab orders & results" },
  { id: "finance_officer" as const, label: "Finance Officer", icon: "cash", color: "#10B981", desc: "Billing & revenue" },
];

export default function LoginScreen() {
  const { colors: c } = useTheme();
  const { signIn, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<ROLES[0]["id"]>("doctor");
  const [hospital, setHospital] = useState(ROLE_HOSPITALS.doctor[0]);
  const [userName, setUserName] = useState(DEFAULT_USERS.doctor);
  const [customName, setCustomName] = useState("");

  const handleSignIn = () => {
    const name = customName.trim() || userName;
    signIn(selectedRole, hospital, name);
  };

  const hospitals = ROLE_HOSPITALS[selectedRole] ?? ROLE_HOSPITALS.doctor;
  const defaultUser = DEFAULT_USERS[selectedRole];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logo, { backgroundColor: c.primary }]}>
              <Ionicons name="medical" size={36} color="#FFFFFF" />
            </View>
            <Text style={[styles.title, { color: c.text }]}>MedNexus</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Hospital Operations Companion
            </Text>
          </View>

          {/* Role Selection */}
          <SectionHeader title="Select Role" subtitle="Choose your clinical role" style={styles.section} />
          <View style={styles.roleGrid}>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.id}
                onPress={() => {
                  setSelectedRole(role.id);
                  setHospital(hospitals[0]);
                  setUserName(defaultUser);
                  setCustomName("");
                }}
                style={[
                  styles.roleCard,
                  selectedRole === role.id && styles.roleCardSelected,
                  { borderColor: role.color },
                ]}
              >
                <View style={[styles.roleIcon, { backgroundColor: `${role.color}20` }]}>
                  <Ionicons name={role.icon} size={24} color={role.color} />
                </View>
                <Text style={[styles.roleLabel, { color: c.text }]}>{role.label}</Text>
                <Text style={[styles.roleDesc, { color: c.textSecondary }]}>{role.desc}</Text>
                {selectedRole === role.id && (
                  <View style={[styles.checkmark, { backgroundColor: role.color }]}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Hospital Selection */}
          <SectionHeader title="Facility" subtitle="Select your hospital" style={styles.section} />
          <Card style={styles.hospitalCard}>
            {hospitals.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => setHospital(h)}
                style={[
                  styles.hospitalOption,
                  hospital === h && styles.hospitalOptionSelected,
                  { borderColor: c.primary },
                ]}
              >
                <Ionicons
                  name="business"
                  size={20}
                  color={hospital === h ? c.primary : c.textSecondary}
                />
                <Text
                  style={[
                    styles.hospitalName,
                    { color: hospital === h ? c.primary : c.text },
                  ]}
                >
                  {h}
                </Text>
                {hospital === h && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={c.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </Card>

          {/* User Name */}
          <SectionHeader title="Display Name" subtitle="How you'll appear in the app" style={styles.section} />
          <Card style={styles.nameCard}>
            <View style={styles.nameInputWrap}>
              <Ionicons name="person" size={20} color={c.textSecondary} />
              <input
                style={styles.nameInput}
                value={customName}
                onChangeText={setCustomName}
                placeholder={defaultUser}
                placeholderTextColor={c.textMuted}
                color={c.text}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            <Text style={[styles.nameHint, { color: c.textMuted }]}>
              Default: {defaultUser}
            </Text>
          </Card>

          {/* Sign In Button */}
          <GradientButton
            label="Sign In"
            icon="log-in"
            fullWidth
            onPress={handleSignIn}
            disabled={isLoading}
            style={styles.signInBtn}
          />
          {isLoading && (
            <Text style={[styles.loading, { color: c.textSecondary }]}>Signing in…</Text>
          )}

          {/* Demo Notice */}
          <View style={styles.demoNotice}>
            <Ionicons name="information-circle" size={16} color={c.info} />
            <Text style={[styles.demoText, { color: c.textSecondary }]}>
              Demo mode — no real authentication. In production, this would connect to your
              identity provider (Supabase Auth, Firebase Auth, etc.).
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: 100, gap: Spacing.three },

  header: { alignItems: "center", gap: Spacing.two, marginTop: Spacing.four },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 15 },

  section: { marginTop: Spacing.two },

  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  roleCard: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: Radii.lg,
    borderWidth: 2,
    padding: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  roleCardSelected: { backgroundColor: "#FFF" },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roleLabel: { fontSize: 14, fontWeight: "700", marginTop: Spacing.two, textAlign: "center" },
  roleDesc: { fontSize: 11, textAlign: "center", marginTop: 2 },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  hospitalCard: { gap: Spacing.one },
  hospitalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radii.md,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  hospitalOptionSelected: { backgroundColor: "#FFF" },
  hospitalName: { flex: 1, fontSize: 15, fontWeight: "600" },

  nameCard: { padding: Spacing.three, gap: Spacing.two },
  nameInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: Radii.md,
    backgroundColor: "transparent",
    paddingHorizontal: Spacing.three,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
    color: "inherit",
  },
  nameHint: { fontSize: 12 },

  signInBtn: { marginTop: Spacing.two },
  loading: { textAlign: "center", marginTop: Spacing.two },

  demoNotice: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.four,
    padding: Spacing.three,
    borderRadius: Radii.md,
    backgroundColor: "#E8E8E8",
  },
  demoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});