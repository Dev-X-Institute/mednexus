import { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";

import { Spacing, Radii } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useSession } from "@/context/auth";
import { useCare } from "@/context/care";
import { getDrugTips } from "@/utils/med-tips";
import { Card, SectionHeader, Badge, ProgressBar } from "@/components/ui";

export default function PatientHomeScreen() {
  const { colors: c } = useTheme();
  const router = useRouter();
  const { session, signOut } = useSession();
  const {
    getPatient,
    getTodayItems,
    getAdherence,
    getDiagnoses,
    getPrescriptions,
    getFamilyContact,
    getFamilyNotificationLogs,
    toggleMedicationTaken,
  } = useCare();

  const patientId = session?.patientId ?? "";
  const patient = getPatient(patientId);
  const todayItems = getTodayItems(patientId);
  const adherence = getAdherence(patientId);
  const diagnoses = getDiagnoses(patientId);
  const prescriptions = getPrescriptions(patientId);
  const familyContact = getFamilyContact(patientId);
  const familyNotifications = getFamilyNotificationLogs(patientId);

  const takenCount = todayItems.filter((i) => i.taken).length;
  const allDone = todayItems.length > 0 && takenCount === todayItems.length;

  // One general tip per distinct medication, capped at 3.
  const tips = useMemo(() => {
    const seen = new Set<string>();
    const out: { drug: string; tip: string }[] = [];
    for (const rx of prescriptions) {
      if (seen.has(rx.drug)) continue;
      seen.add(rx.drug);
      out.push({ drug: rx.drug, tip: getDrugTips(rx.drug)[0] });
      if (out.length >= 3) break;
    }
    return out;
  }, [prescriptions]);

  if (!patient) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.empty}>
          <Text style={{ color: c.textSecondary }}>No patient selected.</Text>
          <TouchableOpacity onPress={signOut} style={styles.signOutLink}>
            <Text style={{ color: c.primary, fontWeight: "700" }}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: c.textSecondary }]}>Hello,</Text>
            <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
              {patient.name}
            </Text>
            <Text style={[styles.sub, { color: c.textMuted }]}>
              {patient.age} · {patient.gender} · {patient.bloodGroup}
            </Text>
          </View>
          <TouchableOpacity
            onPress={signOut}
            style={[styles.iconBtn, { backgroundColor: c.card, borderColor: c.border }]}
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={20} color={c.text} />
          </TouchableOpacity>
        </View>

        {/* AI Medication Companion */}
        <Card style={styles.companion}>
          <View style={styles.companionTop}>
            <View style={styles.streakWrap}>
              <View style={[styles.streakIcon, { backgroundColor: `${c.warning}22` }]}>
                <Ionicons name="flame" size={22} color={c.warning} />
              </View>
              <View>
                <Text style={[styles.streakValue, { color: c.text }]}>
                  {adherence.streak} day{adherence.streak === 1 ? "" : "s"}
                </Text>
                <Text style={[styles.streakLabel, { color: c.textSecondary }]}>
                  adherence streak
                </Text>
              </View>
            </View>
            <Badge label="Companion" tone="info" />
          </View>

          <ProgressBar
            label="Overall adherence"
            valueLabel={`${Math.round(adherence.rate * 100)}%`}
            progress={adherence.rate}
            color={adherence.rate >= 0.8 ? c.success : adherence.rate >= 0.5 ? c.warning : c.critical}
            style={{ marginTop: Spacing.three }}
          />

          {tips.length > 0 && (
            <View style={styles.tips}>
              {tips.map((t) => (
                <View key={t.drug} style={styles.tipRow}>
                  <Ionicons name="bulb-outline" size={16} color={c.confidence} style={{ marginTop: 1 }} />
                  <Text style={[styles.tipText, { color: c.textSecondary }]}>
                    <Text style={{ color: c.text, fontWeight: "700" }}>{t.drug}: </Text>
                    {t.tip}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[styles.companionNote, { color: c.textMuted }]}>
            Tips are general guidance from a built-in knowledge base — not a substitute for your
            doctor or pharmacist.
          </Text>
        </Card>

        {/* Family Circle — mock notification history for the demo only. */}
        {familyContact && (
          <Card style={styles.familyCard}>
            <View style={styles.familyHeader}>
              <View style={[styles.familyIcon, { backgroundColor: `${c.accent}18` }]}>
                <Ionicons name="people-outline" size={21} color={c.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.familyTitle, { color: c.text }]}>Family Circle</Text>
                <Text style={[styles.familyContact, { color: c.textSecondary }]}>
                  {familyContact.name} · {familyContact.relationship}
                </Text>
              </View>
              <Badge label="Demo" tone="default" />
            </View>
            <Text style={[styles.familyDescription, { color: c.textSecondary }]}>
              Your trusted contact can receive care reminders when you choose to share them.
            </Text>
            <View style={[styles.familyLog, { borderTopColor: c.border }]}>
              <Text style={[styles.familyLogTitle, { color: c.textMuted }]}>Notification history</Text>
              {familyNotifications.slice(0, 3).map((entry) => (
                <View key={entry.id} style={styles.familyLogRow}>
                  <Ionicons name="checkmark-circle" size={15} color={c.success} />
                  <Text style={[styles.familyLogText, { color: c.textSecondary }]}>{entry.message}</Text>
                  <Text style={[styles.familyLogTime, { color: c.textMuted }]}>{entry.sentAt}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.familyNote, { color: c.textMuted }]}>No real notifications are sent in this demo.</Text>
          </Card>
        )}

        {/* Today's medications */}
        <SectionHeader
          title="Today's Medications"
          subtitle={
            todayItems.length === 0
              ? "No medications scheduled"
              : allDone
                ? "All done for today — great work!"
                : `${takenCount} of ${todayItems.length} taken`
          }
          right={
            allDone ? <Badge label="Complete" tone="success" /> : undefined
          }
          style={styles.section}
        />
        <Card style={{ gap: Spacing.one }}>
          {todayItems.length === 0 ? (
            <Text style={{ color: c.textSecondary, paddingVertical: Spacing.two }}>
              Nothing to take today.
            </Text>
          ) : (
            todayItems.map((item, i) => (
              <Pressable
                key={item.prescription.id}
                onPress={() => toggleMedicationTaken(item.prescription.id)}
                style={[
                  styles.medRow,
                  i < todayItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.taken }}
                accessibilityLabel={`${item.prescription.drug} ${item.prescription.dosage}, ${
                  item.taken ? "taken" : "not taken"
                }`}
              >
                <Ionicons
                  name={item.taken ? "checkmark-circle" : "ellipse-outline"}
                  size={26}
                  color={item.taken ? c.success : c.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.medName,
                      { color: c.text },
                      item.taken && { textDecorationLine: "line-through", color: c.textMuted },
                    ]}
                  >
                    {item.prescription.drug} {item.prescription.dosage}
                  </Text>
                  <Text style={[styles.medMeta, { color: c.textSecondary }]}>
                    {item.prescription.frequency}
                    {item.prescription.instructions ? ` · ${item.prescription.instructions}` : ""}
                  </Text>
                  {item.prescription.doseTimes.length > 0 && (
                    <View style={styles.medTimes}>
                      {item.prescription.doseTimes.map((t) => (
                        <View
                          key={t}
                          style={[styles.timeChip, { backgroundColor: `${c.primary}1a`, borderColor: `${c.primary}44` }]}
                        >
                          <Ionicons name="alarm-outline" size={11} color={c.primary} />
                          <Text style={[styles.timeChipText, { color: c.primary }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </Pressable>
            ))
          )}
        </Card>

        {/* Quick actions */}
        <SectionHeader title="Care Tools" style={styles.careToolsSection} />
        <View style={styles.actions}>
          <ActionCard
            icon="pulse-outline"
            tint={c.critical}
            title="Check Your Symptoms"
            subtitle="Guided triage"
            onPress={() => router.push("/patient/triage" as Href)}
          />
          <ActionCard
            icon="business-outline"
            tint={c.primary}
            title="Find a Hospital"
            subtitle="Live bed availability"
            onPress={() => router.push("/patient/hospitals" as Href)}
          />
        </View>

        {/* Health history */}
        <SectionHeader
          title="Health History"
          subtitle="Diagnoses and ongoing conditions"
          style={styles.section}
        />

        {(patient.conditions.length > 0 || patient.allergies.length > 0) && (
          <Card style={{ gap: Spacing.two }}>
            {patient.conditions.length > 0 && (
              <View style={styles.tagBlock}>
                <Text style={[styles.tagLabel, { color: c.textSecondary }]}>Conditions</Text>
                <View style={styles.tagRow}>
                  {patient.conditions.map((cond) => (
                    <Badge key={cond} label={cond} tone="info" />
                  ))}
                </View>
              </View>
            )}
            {patient.allergies.length > 0 && (
              <View style={styles.tagBlock}>
                <Text style={[styles.tagLabel, { color: c.textSecondary }]}>Allergies</Text>
                <View style={styles.tagRow}>
                  {patient.allergies.map((a) => (
                    <Badge key={a} label={a} tone="critical" />
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        <Card style={{ gap: Spacing.one }}>
          {diagnoses.length === 0 ? (
            <Text style={{ color: c.textSecondary }}>No diagnoses on record.</Text>
          ) : (
            diagnoses.map((d, i) => (
              <View
                key={d.id}
                style={[
                  styles.dxRow,
                  i < diagnoses.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
                ]}
              >
                <View style={styles.dxHeader}>
                  <Text style={[styles.dxCondition, { color: c.text }]}>{d.condition}</Text>
                  <Text style={[styles.dxDate, { color: c.textMuted }]}>{d.date}</Text>
                </View>
                {!!d.notes && (
                  <Text style={[styles.dxNotes, { color: c.textSecondary }]}>{d.notes}</Text>
                )}
                <Text style={[styles.dxDoctor, { color: c.textMuted }]}>{d.doctor}</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({
  icon,
  tint,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors: c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        { backgroundColor: c.card, borderColor: c.border, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${tint}22` }]}>
        <Ionicons name={icon} size={22} color={tint} />
      </View>
      <Text style={[styles.actionTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.actionSub, { color: c.textSecondary }]}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: 110, gap: Spacing.three },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.two },
  signOutLink: { padding: Spacing.two },

  header: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  greeting: { fontSize: 14, fontWeight: "500" },
  name: { fontSize: 24, fontWeight: "800", marginTop: 2, letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 2 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  companion: { gap: 0 },
  companionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  streakWrap: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  streakIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  streakValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  streakLabel: { fontSize: 12, marginTop: 1 },
  tips: { gap: Spacing.two, marginTop: Spacing.three },
  tipRow: { flexDirection: "row", gap: Spacing.two, alignItems: "flex-start" },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
  companionNote: { fontSize: 11, lineHeight: 16, marginTop: Spacing.three },
  familyCard: { gap: Spacing.two },
  familyHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  familyIcon: { width: 42, height: 42, borderRadius: Radii.md, alignItems: "center", justifyContent: "center" },
  familyTitle: { fontSize: 16, fontWeight: "800" },
  familyContact: { fontSize: 12, marginTop: 2 },
  familyDescription: { fontSize: 13, lineHeight: 19 },
  familyLog: { borderTopWidth: 1, paddingTop: Spacing.two, gap: Spacing.two },
  familyLogTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  familyLogRow: { flexDirection: "row", alignItems: "center", gap: Spacing.one },
  familyLogText: { flex: 1, fontSize: 12 },
  familyLogTime: { fontSize: 11 },
  familyNote: { fontSize: 10 },

  section: { marginTop: Spacing.two },
  careToolsSection: { marginTop: Spacing.four },

  medRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  medName: { fontSize: 16, fontWeight: "600" },
  medMeta: { fontSize: 12, marginTop: 2 },
  medTimes: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one, marginTop: Spacing.one },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timeChipText: { fontSize: 11, fontWeight: "700" },

  actions: { flexDirection: "row", gap: Spacing.three, marginTop: Spacing.one },
  actionCard: {
    flex: 1,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.two,
  },
  actionTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  actionSub: { fontSize: 12, marginTop: Spacing.one },

  tagBlock: { gap: Spacing.one },
  tagLabel: { fontSize: 12, fontWeight: "600" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },

  dxRow: { paddingVertical: Spacing.two, gap: 2 },
  dxHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dxCondition: { fontSize: 15, fontWeight: "700", flex: 1 },
  dxDate: { fontSize: 12, marginLeft: Spacing.two },
  dxNotes: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  dxDoctor: { fontSize: 12, marginTop: 2 },
});
