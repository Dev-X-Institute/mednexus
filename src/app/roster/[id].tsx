import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";

import { Spacing, Radii } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useSession } from "@/context/auth";
import { useCare } from "@/context/care";
import { Card, SectionHeader, Badge, GradientButton, Chip } from "@/components/ui";

const FREQUENCIES: { label: string; timesPerDay: number; defaultTimes: string[] }[] = [
  { label: "Once daily", timesPerDay: 1, defaultTimes: ["08:00"] },
  { label: "Twice daily", timesPerDay: 2, defaultTimes: ["08:00", "20:00"] },
  { label: "Three times daily", timesPerDay: 3, defaultTimes: ["08:00", "14:00", "20:00"] },
  { label: "As needed", timesPerDay: 1, defaultTimes: [] },
];

/** Coerce a typed time into "HH:MM" (24h), falling back to a safe default. */
function normalizeTime(raw: string, fallback: string): string {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return fallback;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function PatientDetailScreen() {
  const { colors: c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const { getPatient, getDiagnoses, getPrescriptions, addDiagnosis, addPrescription } = useCare();

  const patientId = typeof id === "string" ? id : "";
  const patient = getPatient(patientId);
  const diagnoses = getDiagnoses(patientId);
  const prescriptions = getPrescriptions(patientId);
  const doctorName = session?.userName ?? "Attending physician";

  // Diagnosis form
  const [dxOpen, setDxOpen] = useState(false);
  const [dxCondition, setDxCondition] = useState("");
  const [dxNotes, setDxNotes] = useState("");

  // Prescription form
  const [rxOpen, setRxOpen] = useState(false);
  const [rxDrug, setRxDrug] = useState("");
  const [rxDosage, setRxDosage] = useState("");
  const [rxFreqIdx, setRxFreqIdx] = useState(0);
  const [rxTimes, setRxTimes] = useState<string[]>(FREQUENCIES[0].defaultTimes);
  const [rxInstructions, setRxInstructions] = useState("");

  const selectFrequency = (idx: number) => {
    setRxFreqIdx(idx);
    setRxTimes(FREQUENCIES[idx].defaultTimes);
  };

  const setDoseTime = (i: number, value: string) => {
    setRxTimes((prev) => prev.map((t, j) => (j === i ? value : t)));
  };

  if (!patient) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["bottom"]}>
        <Stack.Screen options={{ title: "Patient" }} />
        <View style={styles.missing}>
          <Text style={{ color: c.textSecondary }}>Patient not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const submitDiagnosis = () => {
    if (!dxCondition.trim()) return;
    addDiagnosis({
      patientId,
      condition: dxCondition.trim(),
      notes: dxNotes.trim(),
      doctor: doctorName,
    });
    setDxCondition("");
    setDxNotes("");
    setDxOpen(false);
  };

  const submitPrescription = () => {
    if (!rxDrug.trim() || !rxDosage.trim()) return;
    const freq = FREQUENCIES[rxFreqIdx];
    const doseTimes = freq.defaultTimes.length > 0 ? rxTimes.map((t) => normalizeTime(t, "08:00")) : [];
    addPrescription({
      patientId,
      drug: rxDrug.trim(),
      dosage: rxDosage.trim(),
      frequency: freq.label,
      timesPerDay: freq.timesPerDay,
      doseTimes,
      instructions: rxInstructions.trim() || undefined,
      prescribedBy: doctorName,
    });
    setRxDrug("");
    setRxDosage("");
    setRxFreqIdx(0);
    setRxTimes(FREQUENCIES[0].defaultTimes);
    setRxInstructions("");
    setRxOpen(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["bottom"]}>
      <Stack.Screen options={{ title: patient.name }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Patient summary */}
          <Card style={{ gap: Spacing.two }}>
            <View style={styles.summaryTop}>
              <View style={[styles.avatar, { backgroundColor: c.backgroundElement }]}>
                <Ionicons name="person" size={26} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.text }]}>{patient.name}</Text>
                <Text style={[styles.meta, { color: c.textSecondary }]}>
                  {patient.age} · {patient.gender} · Blood group {patient.bloodGroup}
                </Text>
              </View>
            </View>

            {patient.allergies.length > 0 && (
              <View style={[styles.allergyBanner, { backgroundColor: `${c.critical}18`, borderColor: `${c.critical}55` }]}>
                <Ionicons name="warning" size={16} color={c.critical} />
                <Text style={[styles.allergyText, { color: c.critical }]}>
                  Allergies: {patient.allergies.join(", ")}
                </Text>
              </View>
            )}

            {patient.conditions.length > 0 && (
              <View style={styles.tagRow}>
                {patient.conditions.map((cond) => (
                  <Badge key={cond} label={cond} tone="info" />
                ))}
              </View>
            )}
          </Card>

          {/* Diagnoses */}
          <SectionHeader
            title="Diagnoses"
            subtitle={`${diagnoses.length} on record`}
            right={
              <Pressable onPress={() => setDxOpen((v) => !v)} hitSlop={8} style={styles.addLink}>
                <Ionicons name={dxOpen ? "close" : "add"} size={18} color={c.primary} />
                <Text style={[styles.addLinkText, { color: c.primary }]}>
                  {dxOpen ? "Cancel" : "Add"}
                </Text>
              </Pressable>
            }
            style={styles.section}
          />

          {dxOpen && (
            <Card style={styles.form}>
              <Field
                label="Condition"
                value={dxCondition}
                onChangeText={setDxCondition}
                placeholder="e.g. Acute bronchitis"
              />
              <Field
                label="Clinical notes"
                value={dxNotes}
                onChangeText={setDxNotes}
                placeholder="Findings, plan, follow-up…"
                multiline
              />
              <GradientButton
                label="Save Diagnosis"
                icon="checkmark"
                fullWidth
                onPress={submitDiagnosis}
              />
            </Card>
          )}

          <Card style={{ gap: Spacing.one }}>
            {diagnoses.length === 0 ? (
              <Text style={{ color: c.textSecondary }}>No diagnoses recorded yet.</Text>
            ) : (
              diagnoses.map((d, i) => (
                <View
                  key={d.id}
                  style={[
                    styles.row,
                    i < diagnoses.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
                  ]}
                >
                  <View style={styles.rowHead}>
                    <Text style={[styles.rowTitle, { color: c.text }]}>{d.condition}</Text>
                    <Text style={[styles.rowDate, { color: c.textMuted }]}>{d.date}</Text>
                  </View>
                  {!!d.notes && (
                    <Text style={[styles.rowNotes, { color: c.textSecondary }]}>{d.notes}</Text>
                  )}
                  <Text style={[styles.rowBy, { color: c.textMuted }]}>{d.doctor}</Text>
                </View>
              ))
            )}
          </Card>

          {/* Prescriptions */}
          <SectionHeader
            title="Prescriptions"
            subtitle={`${prescriptions.length} active`}
            right={
              <Pressable onPress={() => setRxOpen((v) => !v)} hitSlop={8} style={styles.addLink}>
                <Ionicons name={rxOpen ? "close" : "add"} size={18} color={c.primary} />
                <Text style={[styles.addLinkText, { color: c.primary }]}>
                  {rxOpen ? "Cancel" : "Add"}
                </Text>
              </Pressable>
            }
            style={styles.section}
          />

          {rxOpen && (
            <Card style={styles.form}>
              <Field
                label="Medication"
                value={rxDrug}
                onChangeText={setRxDrug}
                placeholder="e.g. Amoxicillin"
              />
              <Field
                label="Dosage"
                value={rxDosage}
                onChangeText={setRxDosage}
                placeholder="e.g. 500mg"
              />
              <View>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Frequency</Text>
                <View style={styles.freqRow}>
                  {FREQUENCIES.map((f, i) => (
                    <Chip
                      key={f.label}
                      label={f.label}
                      selected={rxFreqIdx === i}
                      onPress={() => selectFrequency(i)}
                    />
                  ))}
                </View>
              </View>
              {rxTimes.length > 0 && (
                <View>
                  <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>
                    Dose times (24h) — a reminder and calendar event are set for each
                  </Text>
                  <View style={styles.timeRow}>
                    {rxTimes.map((t, i) => (
                      <TextInput
                        key={i}
                        style={[
                          styles.timeInput,
                          { color: c.text, backgroundColor: c.backgroundElement, borderColor: c.border },
                        ]}
                        value={t}
                        onChangeText={(v) => setDoseTime(i, v)}
                        placeholder="08:00"
                        placeholderTextColor={c.textMuted}
                        maxLength={5}
                        autoCapitalize="none"
                        keyboardType="numbers-and-punctuation"
                      />
                    ))}
                  </View>
                </View>
              )}
              <Field
                label="Instructions (optional)"
                value={rxInstructions}
                onChangeText={setRxInstructions}
                placeholder="e.g. Take with food"
              />
              <GradientButton
                label="Save Prescription"
                icon="checkmark"
                fullWidth
                onPress={submitPrescription}
              />
            </Card>
          )}

          <Card style={{ gap: Spacing.one }}>
            {prescriptions.length === 0 ? (
              <Text style={{ color: c.textSecondary }}>No prescriptions yet.</Text>
            ) : (
              prescriptions.map((r, i) => (
                <View
                  key={r.id}
                  style={[
                    styles.row,
                    i < prescriptions.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
                  ]}
                >
                  <View style={styles.rowHead}>
                    <Text style={[styles.rowTitle, { color: c.text }]}>
                      {r.drug} {r.dosage}
                    </Text>
                    <Badge label={r.frequency} tone="default" />
                  </View>
                  {!!r.instructions && (
                    <Text style={[styles.rowNotes, { color: c.textSecondary }]}>{r.instructions}</Text>
                  )}
                  {r.doseTimes.length > 0 && (
                    <View style={styles.rowTimes}>
                      <Ionicons name="alarm-outline" size={13} color={c.textMuted} />
                      <Text style={[styles.rowTimesText, { color: c.textMuted }]}>
                        Reminders daily at {r.doseTimes.join(", ")}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.rowBy, { color: c.textMuted }]}>
                    {r.prescribedBy} · from {r.startDate}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const { colors: c } = useTheme();
  return (
    <View>
      <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { color: c.text, backgroundColor: c.backgroundElement, borderColor: c.border },
          multiline && { height: 84, textAlignVertical: "top" },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        multiline={multiline}
        autoCapitalize="sentences"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },
  missing: { flex: 1, alignItems: "center", justifyContent: "center" },

  summaryTop: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  meta: { fontSize: 13, marginTop: 2 },

  allergyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.two,
  },
  allergyText: { flex: 1, fontSize: 13, fontWeight: "700" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },

  section: { marginTop: Spacing.two },
  addLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  addLinkText: { fontSize: 14, fontWeight: "700" },

  form: { gap: Spacing.two },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  freqRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  timeRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two, marginTop: Spacing.one },
  timeInput: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 15,
    width: 88,
    textAlign: "center",
  },

  row: { paddingVertical: Spacing.two, gap: 3 },
  rowHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.two },
  rowTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  rowDate: { fontSize: 12 },
  rowNotes: { fontSize: 13, lineHeight: 18 },
  rowTimes: { flexDirection: "row", alignItems: "center", gap: Spacing.one, marginTop: 2 },
  rowTimesText: { fontSize: 12 },
  rowBy: { fontSize: 12 },
});
