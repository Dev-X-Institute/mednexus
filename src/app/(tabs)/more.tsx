import { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing, Radii, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useSession } from "@/context/auth";
import { useDemo } from "@/context/demo";
import { useAccessibility } from "@/context/accessibility";
import { Card, SectionHeader, Badge, GradientButton } from "@/components/ui";
import type { RoleId } from "@/utils/types";

type GlyphName = keyof typeof Ionicons.glyphMap;
type ThemeColors = Record<ThemeColor, string>;

const ROLE_CONFIG: Record<RoleId, { label: string; icon: GlyphName; color: string }> = {
  admin: { label: "Administrator", icon: "shield-checkmark", color: "#6366F1" },
  doctor: { label: "Doctor", icon: "medical", color: "#EF4444" },
  nurse: { label: "Nurse", icon: "heart", color: "#EC4899" },
  pharmacist: { label: "Pharmacist", icon: "medkit", color: "#14B8A6" },
  lab_scientist: { label: "Lab Scientist", icon: "flask", color: "#F59E0B" },
  finance_officer: { label: "Finance Officer", icon: "cash", color: "#10B981" },
};

const DEPARTMENTS: { id: string; name: string; icon: GlyphName; color: string }[] = [
  { id: "emergency", name: "Emergency", icon: "people", color: "#EF4444" },
  { id: "icu", name: "ICU", icon: "pulse", color: "#10B981" },
  { id: "surgery", name: "Surgery", icon: "time", color: "#6366F1" },
  { id: "medicine", name: "Medicine", icon: "medical", color: "#14B8A6" },
  { id: "pediatrics", name: "Pediatrics", icon: "body", color: "#EC4899" },
  { id: "cardiology", name: "Cardiology", icon: "heart", color: "#F59E0B" },
  { id: "pharmacy", name: "Pharmacy", icon: "medkit", color: "#0EA5E9" },
  { id: "laboratory", name: "Laboratory", icon: "flask", color: "#8B5CF6" },
];

const NOTIFICATION_TYPES = [
  { id: "critical_alerts", label: "Critical Alerts", desc: "Code blues, ICU capacity, critical stockouts" },
  { id: "shift_changes", label: "Shift Changes", desc: "Handover reminders, staffing updates" },
  { id: "predictions", label: "AI Predictions", desc: "Forecast updates, anomaly detection" },
  { id: "resource_requests", label: "Resource Requests", desc: "Bed transfers, equipment needs" },
  { id: "case_matches", label: "Case Matches", desc: "New similar cases in clinical memory" },
];

export default function MoreScreen() {
  const { colors: c } = useTheme();
  const { session, signOut } = useSession();
  const { mode, setMode } = useDemo();
  const { reduceMotion } = useAccessibility();
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    useMemo(() => NOTIFICATION_TYPES.reduce((acc, n) => ({ ...acc, [n.id]: true }), {}), [])
  );
  const [selectedDepts, setSelectedDepts] = useState<string[]>(
    useMemo(() => DEPARTMENTS.slice(0, 3).map((d) => d.id), [])
  );

  const roleConfig = session ? ROLE_CONFIG[session.role] : ROLE_CONFIG.admin;
  const isAdmin = session?.role === "admin";

  const toggleNotification = (id: string) => {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDept = (id: string) => {
    setSelectedDepts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleModeChange = (newMode: "demo" | "live") => {
    setMode(newMode);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: roleConfig.color, borderColor: c.border },
              ]}
            >
              <Ionicons name={roleConfig.icon} size={28} color="#FFFFFF" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: c.text }]}>
                {session?.userName ?? "Dr. Ama Osei"}
              </Text>
              <Text style={[styles.userRole, { color: c.textSecondary }]}>
                {roleConfig.label} · {session?.hospital ?? "Korle Bu Teaching Hospital"}
              </Text>
            </View>
            <Badge
              label={mode === "live" ? "Live" : "Demo"}
              tone={mode === "live" ? "info" : "default"}
            />
          </View>
        </Card>

        {/* Settings */}
        <SectionHeader title="Settings" subtitle="Preferences & configuration" style={styles.section} />

        <Card style={styles.settingsCard}>
          <SettingRow
            icon="moon"
            iconColor="#6366F1"
            title="Dark Mode"
            subtitle="System preference"
            accessory={
              <ThemeToggle />
            }
          />
          <Divider color={c.border} />
          <SettingRow
            icon="wifi"
            iconColor="#14B8A6"
            title="Data Mode"
            subtitle={mode === "live" ? "Connected to live data" : "Using demo data"}
            accessory={
              <ModeSelector value={mode} onChange={handleModeChange} />
            }
          />
          <Divider color={c.border} />
          <SettingRow
            icon="accessibility"
            iconColor="#8B5CF6"
            title="Reduce Motion"
            subtitle={reduceMotion ? "Animations disabled" : "Animations enabled"}
            accessory={
              <Switch
                value={reduceMotion}
                onValueChange={() => {}}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor={reduceMotion ? c.primary : c.textMuted}
              />
            }
          />
          <Divider color={c.border} />
          <SettingRow
            icon="notifications"
            iconColor="#F59E0B"
            title="Push Notifications"
            subtitle="Manage alert preferences"
            accessory={<Ionicons name="chevron-forward" size={20} color={c.textMuted} />}
            onPress={() => {}}
          />
        </Card>

        {/* Notifications */}
        <SectionHeader title="Notifications" subtitle="Configure alert channels" style={styles.section} />

        <Card style={styles.notificationCard}>
          {NOTIFICATION_TYPES.map((n) => (
            <NotificationRow
              key={n.id}
              title={n.label}
              subtitle={n.desc}
              enabled={notifications[n.id]}
              onToggle={() => toggleNotification(n.id)}
              color={c}
            />
          ))}
        </Card>

        {/* Department Management */}
        {isAdmin && (
          <>
            <SectionHeader
              title="Department Management"
              subtitle="Configure visible departments"
              style={styles.section}
            />

            <Card style={styles.deptCard}>
              <View style={styles.deptGrid}>
                {DEPARTMENTS.map((dept) => (
                  <DeptChip
                    key={dept.id}
                    dept={dept}
                    selected={selectedDepts.includes(dept.id)}
                    onPress={() => toggleDept(dept.id)}
                    color={c}
                  />
                ))}
              </View>
              <Text style={[styles.deptHint, { color: c.textMuted }]}>
                {selectedDepts.length} of {DEPARTMENTS.length} departments selected
              </Text>
            </Card>
          </>
        )}

        {/* Role & Access */}
        <SectionHeader title="Role & Access" subtitle="Current permissions" style={styles.section} />

        <Card style={styles.accessCard}>
          <View style={styles.accessRow}>
            <View style={[styles.accessIcon, { backgroundColor: roleConfig.color }]}>
              <Ionicons name={roleConfig.icon} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.accessInfo}>
              <Text style={[styles.accessTitle, { color: c.text }]}>{roleConfig.label}</Text>
              <Text style={[styles.accessDesc, { color: c.textSecondary }]}>
                {getRolePermissions(session?.role ?? "admin").join(", ")}
              </Text>
            </View>
          </View>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color={c.success} />
              <Text style={[styles.adminText, { color: c.success }]}>Administrator Access</Text>
            </View>
          )}
        </Card>

        {/* About / Version */}
        <SectionHeader title="About" subtitle="App information" style={styles.section} />

        <Card style={styles.aboutCard}>
          <AboutRow label="Version" value="1.0.0" color={c} />
          <Divider color={c.border} />
          <AboutRow label="Build" value="Expo SDK 57" color={c} />
          <Divider color={c.border} />
          <AboutRow label="Environment" value={mode === "live" ? "Production" : "Development"} color={c} />
          <Divider color={c.border} />
          <AboutRow label="Data Source" value={mode === "live" ? "API (Supabase)" : "Local JSON"} color={c} />
        </Card>

        {/* Sign Out */}
        <View style={styles.signOutWrap}>
          <GradientButton
            label="Sign Out"
            icon="log-out"
            variant="ghost"
            fullWidth
            onPress={handleSignOut}
            style={styles.signOutBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemeToggle() {
  const { mode, toggleTheme, colors } = useTheme();
  const icons: Record<string, GlyphName> = { light: "sunny", dark: "moon", system: "settings" };
  const labels = { light: "Light", dark: "Dark", system: "System" };

  return (
    <Pressable onPress={toggleTheme} style={styles.themeBtn}>
      <Ionicons name={icons[mode]} size={20} color={colors.text} />
      <Text style={[styles.themeLabel, { color: colors.text }]}>{labels[mode]}</Text>
    </Pressable>
  );
}

function ModeSelector({ value, onChange }: { value: "demo" | "live"; onChange: (v: "demo" | "live") => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.modeSegment}>
      {["demo", "live"].map((m) => (
        <Pressable
          key={m}
          onPress={() => onChange(m as "demo" | "live")}
          style={[
            styles.modeSegmentBtn,
            value === m && styles.modeSegmentBtnActive,
            { backgroundColor: value === m ? colors.primary : colors.card },
          ]}
        >
          <Text
            style={[
              styles.modeSegmentText,
              { color: value === m ? "#FFFFFF" : colors.text },
            ]}
          >
            {m === "demo" ? "Demo" : "Live"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function SettingRow({
  icon,
  iconColor,
  title,
  subtitle,
  accessory,
  onPress,
}: {
  icon: GlyphName;
  iconColor: string;
  title: string;
  subtitle: string;
  accessory: React.ReactNode;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      {accessory}
    </Pressable>
  );
}

function NotificationRow({
  title,
  subtitle,
  enabled,
  onToggle,
  color,
}: {
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: () => void;
  color: ThemeColors;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.notificationRow}>
      <View style={styles.notificationText}>
        <Text style={[styles.notificationTitle, { color: color.text }]}>{title}</Text>
        <Text style={[styles.notificationSubtitle, { color: color.textSecondary }]}>{subtitle}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: color.border, true: color.primary }}
        thumbColor={enabled ? color.primary : color.textMuted}
      />
    </Pressable>
  );
}

function DeptChip({
  dept,
  selected,
  onPress,
  color,
}: {
  dept: { id: string; name: string; icon: GlyphName; color: string };
  selected: boolean;
  onPress: () => void;
  color: ThemeColors;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.deptChip, selected && styles.deptChipSelected, { borderColor: dept.color }]}>
      <View style={[styles.deptChipIcon, { backgroundColor: selected ? dept.color : `${dept.color}20` }]}>
        <Ionicons name={dept.icon} size={18} color={selected ? "#FFFFFF" : dept.color} />
      </View>
      <Text
        style={[
          styles.deptChipLabel,
          { color: selected ? dept.color : color.text },
        ]}
      >
        {dept.name}
      </Text>
    </Pressable>
  );
}

function AboutRow({ label, value, color }: { label: string; value: string; color: ThemeColors }) {
  return (
    <View style={styles.aboutRow}>
      <Text style={[styles.aboutLabel, { color: color.textSecondary }]}>{label}</Text>
      <Text style={[styles.aboutValue, { color: color.text }]}>{value}</Text>
    </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

function getRolePermissions(role: RoleId): string[] {
  const perms: Record<RoleId, string[]> = {
    admin: ["All Access", "User Management", "System Config", "Analytics Export"],
    doctor: ["Patient Records", "Orders", "Clinical Notes", "Case Search"],
    nurse: ["Patient Vitals", "Medication Admin", "Shift Handover", "Care Plans"],
    pharmacist: ["Inventory", "Prescriptions", "Stock Alerts", "Formulary"],
    lab_scientist: ["Lab Orders", "Results Entry", "QC Management", "Reference Ranges"],
    finance_officer: ["Billing", "Insurance Claims", "Revenue Reports", "Budget Tracking"],
  };
  return perms[role] ?? [];
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: 100, gap: Spacing.three },

  section: { marginTop: Spacing.two },

  profileCard: { padding: Spacing.three },
  profileRow: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  profileInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: "700" },
  userRole: { fontSize: 13, marginTop: 2 },

  settingsCard: { overflow: "hidden" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: "600" },
  settingSubtitle: { fontSize: 12, marginTop: 1 },

  divider: { height: 1, marginHorizontal: Spacing.three },

  themeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
    backgroundColor: "#E8E8E8",
  },
  themeLabel: { fontSize: 13, fontWeight: "600" },

  modeSegment: {
    flexDirection: "row",
    backgroundColor: "#F1F1F1",
    borderRadius: Radii.pill,
    padding: 4,
  },
  modeSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    alignItems: "center",
  },
  modeSegmentBtnActive: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  modeSegmentText: { fontSize: 13, fontWeight: "600" },

  notificationCard: { gap: Spacing.one },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  notificationText: { flex: 1 },
  notificationTitle: { fontSize: 15, fontWeight: "600" },
  notificationSubtitle: { fontSize: 12, marginTop: 1 },

  deptCard: { gap: Spacing.three, paddingBottom: Spacing.one },
  deptGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  deptChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
  },
  deptChipSelected: { backgroundColor: "#FFF" },
  deptChipIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deptChipLabel: { fontSize: 12, fontWeight: "600" },
  deptHint: { fontSize: 12, textAlign: "center", marginTop: Spacing.one },

  accessCard: { padding: Spacing.three },
  accessRow: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  accessIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  accessInfo: { flex: 1 },
  accessTitle: { fontSize: 16, fontWeight: "700" },
  accessDesc: { fontSize: 12, marginTop: 2, lineHeight: 18 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
    backgroundColor: "#D1FAE5",
    alignSelf: "flex-start",
  },
  adminText: { fontSize: 12, fontWeight: "700" },

  aboutCard: { overflow: "hidden" },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  aboutLabel: { fontSize: 14 },
  aboutValue: { fontSize: 14, fontWeight: "600" },

  signOutWrap: { marginTop: Spacing.two },
  signOutBtn: { backgroundColor: "transparent" },
});