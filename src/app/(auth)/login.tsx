import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing, Radii } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth, ROLE_HOSPITALS, DEFAULT_USERS } from "@/context/auth";
import { useCare } from "@/context/care";
import { Card, GradientButton, SectionHeader, Badge } from "@/components/ui";
import type { RoleId, Audience } from "@/utils/types";

type RoleOption = {
  id: RoleId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  desc: string;
};

const ROLES: RoleOption[] = [
  { id: "admin" as const, label: "Administrator", icon: "shield-checkmark", color: "#6366F1", desc: "Full system access" },
  { id: "doctor" as const, label: "Doctor", icon: "medical", color: "#EF4444", desc: "Patient care & orders" },
  { id: "nurse" as const, label: "Nurse", icon: "heart", color: "#EC4899", desc: "Vitals & medication admin" },
  { id: "pharmacist" as const, label: "Pharmacist", icon: "medkit", color: "#14B8A6", desc: "Inventory & prescriptions" },
  { id: "lab_scientist" as const, label: "Lab Scientist", icon: "flask", color: "#F59E0B", desc: "Lab orders & results" },
  { id: "finance_officer" as const, label: "Finance Officer", icon: "cash", color: "#10B981", desc: "Billing & revenue" },
];

export default function LoginScreen() {
  const { colors: c } = useTheme();
  const { signIn, signInPatient, isLoading } = useAuth();
  const { patients } = useCare();
  const [audience, setAudience] = useState<Audience>("staff");
  const [selectedRole, setSelectedRole] = useState<RoleId>("doctor");
  const [hospital, setHospital] = useState(ROLE_HOSPITALS.doctor[0]);
  const [userName, setUserName] = useState(DEFAULT_USERS.doctor);
  const [customName, setCustomName] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id ?? "");

  const handleSignIn = () => {
    if (audience === "patient") {
      const patient = patients.find((p) => p.id === selectedPatientId);
      if (!patient) return;
      signInPatient(patient.id, patient.name);
      return;
    }
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

          {/* Audience toggle */}
          <View style={[styles.segment, { backgroundColor: c.card, borderColor: c.border }]}>
            {(["staff", "patient"] as const).map((a) => {
              const active = audience === a;
              return (
                <TouchableOpacity
                  key={a}
                  onPress={() => setAudience(a)}
                  style={[styles.segmentBtn, active && { backgroundColor: c.primary }]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons
                    name={a === "staff" ? "briefcase" : "person"}
                    size={16}
                    color={active ? "#FFFFFF" : c.textSecondary}
                  />
                  <Text
                    style={[
                      styles.segmentLabel,
                      { color: active ? "#FFFFFF" : c.textSecondary },
                    ]}
                  >
                    {a === "staff" ? "Staff" : "Patient"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {audience === "staff" ? (
            <>
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
                      <Ionicons name="checkmark-circle" size={20} color={c.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </Card>

              {/* User Name */}
              <SectionHeader title="Display Name" subtitle="How you'll appear in the app" style={styles.section} />
              <Card style={styles.nameCard}>
                <View style={styles.nameInputWrap}>
                  <Ionicons name="person" size={20} color={c.textSecondary} />
                  <TextInput
                    style={[styles.nameInput, { color: c.text }]}
                    value={customName}
                    onChangeText={setCustomName}
                    placeholder={defaultUser}
                    placeholderTextColor={c.textMuted}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                <Text style={[styles.nameHint, { color: c.textMuted }]}>
                  Default: {defaultUser}
                </Text>
              </Card>
            </>
          ) : (
            <>
              {/* Patient Selection */}
              <SectionHeader
                title="Select Patient"
                subtitle="Sign in to view your care plan"
                style={styles.section}
              />
              <Card style={styles.hospitalCard}>
                {patients.map((p) => {
                  const active = selectedPatientId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setSelectedPatientId(p.id)}
                      style={[
                        styles.patientOption,
                        { borderColor: active ? c.primary : c.border },
                        active && { backgroundColor: `${c.primary}14` },
                      ]}
                    >
                      <View
                        style={[
                          styles.patientAvatar,
                          { backgroundColor: active ? c.primary : c.backgroundElement },
                        ]}
                      >
                        <Ionicons
                          name="person"
                          size={20}
                          color={active ? "#FFFFFF" : c.textSecondary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.patientName, { color: c.text }]}>{p.name}</Text>
                        <Text style={[styles.patientMeta, { color: c.textSecondary }]}>
                          {p.age} · {p.gender} · {p.bloodGroup}
                        </Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={22} color={c.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </Card>
              <View style={styles.patientNote}>
                <Ionicons name="lock-closed" size={14} color={c.textMuted} />
                <Text style={[styles.demoText, { color: c.textSecondary }]}>
                  Patients only see their own records. Staff sign-in is a separate mode above.
                </Text>
              </View>
            </>
          )}

          {/* Sign In Button */}
          <GradientButton
            label="Sign In"
            icon="log-in"
            fullWidth
            onPress={handleSignIn}
            loading={isLoading}
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
  },
  nameHint: { fontSize: 12 },

  segment: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: Radii.pill,
    padding: 4,
    gap: 4,
    marginTop: Spacing.four,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderRadius: Radii.pill,
  },
  segmentLabel: { fontSize: 14, fontWeight: "700" },

  patientOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  patientName: { fontSize: 15, fontWeight: "700" },
  patientMeta: { fontSize: 12, marginTop: 2 },
  patientNote: {
    flexDirection: "row",
    gap: Spacing.two,
    alignItems: "center",
    paddingHorizontal: Spacing.one,
    marginTop: Spacing.one,
  },

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