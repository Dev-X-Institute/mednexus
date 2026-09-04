import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing } from "@/constants/theme";
import { Card, SectionHeader, Chip, GradientButton, Badge } from "@/components/ui";
import { matchPatientProfile, similarCases } from "@/utils/cases";
import { useDemo } from "@/context/demo";
import {
  generateNarrative,
  claudeConfigured,
  CLAUDE_LABEL,
  type ClaudeNarrative,
} from "@/utils/claude";

const c = Colors.light;
const SYMPTOMS = ["Fever", "Chest pain", "Dyspnea", "Kidney injury", "Hypertension", "Hypotension", "Cough", "Abdominal pain", "Headache", "Fatigue", "Tachycardia", "Confusion"];

export default function MemoryScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [ageText, setAgeText] = useState("45");
  const [selected, setSelected] = useState<string[]>(["Fever", "Hypertension"]);
  const [notes, setNotes] = useState("");
  const [searched, setSearched] = useState(false);
  const [narrating, setNarrating] = useState(false);
  const [narrative, setNarrative] = useState<ClaudeNarrative | null>(null);
  const [aiFailed, setAiFailed] = useState(false);
  const { mode } = useDemo();
  const age = useMemo(() => {
    const n = parseInt(ageText, 10);
    if (Number.isNaN(n)) return 0;
    return Math.max(1, Math.min(100, n));
  }, [ageText]);
  const profile = useMemo(() => ({ age, symptoms: selected, notes }), [age, selected, notes]);
  const result = useMemo(() => matchPatientProfile(profile), [profile]);
  const matches = useMemo(() => similarCases(profile), [profile]);
  const onAgeChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, 3);
    setAgeText(digits);
    setSearched(false);
  };
  const toggle = (symptom: string) => { setSelected((items) => items.includes(symptom) ? items.filter((item) => item !== symptom) : [...items, symptom]); setSearched(false); };

  const runSearch = async () => {
    setSearched(true);
    setNarrative(null);
    setAiFailed(false);
    if (mode !== "live") return;
    setNarrating(true);
    const out = await generateNarrative(profile, matchPatientProfile(profile));
    setNarrating(false);
    if (out) setNarrative(out);
    else setAiFailed(true);
  };

  // When the universal switch flips to "live" while a search is already shown,
  // fetch the real Claude narrative automatically. Demo/live rendering is gated
  // at render time, so switching back to "demo" simply hides live data.
  useEffect(() => {
    if (mode === "live" && searched && !narrative && !narrating) {
      // Intentional: refetch the live narrative when the global switch flips to live.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, searched]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Card variant="elevated" style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="library-outline" size={27} color={c.text} /></View>
          <View style={styles.heroCopy}><Text style={styles.heroTitle}>AI Doctor Memory</Text><Text style={styles.heroSubtitle}>Search anonymized clinical patterns across 34 hospitals</Text></View>
        </Card>
        <Card style={styles.form}>
          <SectionHeader title="Patient profile" subtitle="Use de-identified clinical information only" />
          <View style={styles.ageRow}><View><Text style={styles.label}>Age</Text><Text style={styles.hint}>Years</Text></View><TextInput value={ageText} onChangeText={onAgeChange} keyboardType="number-pad" maxLength={3} placeholder="—" placeholderTextColor={c.textMuted} selectTextOnFocus style={styles.ageInput} /></View>
          <Text style={styles.label}>Symptoms & conditions</Text>
          <View style={styles.chips}>{SYMPTOMS.map((symptom) => <Chip key={symptom} label={symptom} selected={selected.includes(symptom)} onPress={() => toggle(symptom)} />)}</View>
          <Text style={styles.label}>Clinical notes <Text style={styles.optional}>optional</Text></Text>
          <TextInput value={notes} onFocus={() => setTimeout(() => scrollRef.current?.scrollTo({ y: 250, animated: true }), 120)} onChangeText={(value) => { setNotes(value); setSearched(false); }} placeholder="Labs, imaging, history, or current concern…" placeholderTextColor={c.textMuted} multiline textAlignVertical="top" style={styles.notes} />
          <GradientButton label="Search Knowledge Network" icon="search-outline" fullWidth onPress={runSearch} />
        </Card>
        {searched ? <>
          {mode === "live" && (narrating ? (
            <Card style={styles.aiLoading}>
              <ActivityIndicator color={c.primary} />
              <Text style={styles.aiLoadingText}>Synthesizing clinical narrative with Claude…</Text>
            </Card>
          ) : narrative ? (
            <Card style={styles.recommendation}>
              <SectionHeader title="AI clinical narrative" right={<Badge label="Live · Anthropic" tone="info" />} />
              <Text style={styles.summary}>{narrative.summary}</Text>
              <Text style={styles.blockLabel}>Rationale</Text>
              {narrative.rationale.map((step, index) => (
                <View style={styles.step} key={`r-${index}`}>
                  <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
              {narrative.risks.length > 0 && <Text style={styles.blockLabel}>Risks to monitor</Text>}
              {narrative.risks.length > 0 && (
                <View style={styles.complications}>{narrative.risks.map((item) => <Badge key={`risk-${item}`} label={item} tone="warning" />)}</View>
              )}
              {narrative.flags.length > 0 && <Text style={styles.blockLabel}>Red-flag cautions</Text>}
              {narrative.flags.length > 0 && (
                <View style={styles.complications}>{narrative.flags.map((item) => <Badge key={`flag-${item}`} label={item} tone="critical" />)}</View>
              )}
              <Text style={styles.sourceNote}>{CLAUDE_LABEL}</Text>
            </Card>
          ) : aiFailed ? (
            <View style={styles.fallbackRow}>
              <Ionicons name="cloud-offline-outline" size={16} color={c.textSecondary} />
              <Text style={styles.fallbackText}>
                {claudeConfigured()
                  ? "Claude unreachable — showing local knowledge-network match."
                  : "Running on local knowledge network (no API key configured)."}
              </Text>
            </View>
          ) : null )}
          <Card style={styles.recommendation}>
            <SectionHeader
              title="AI recommendation"
              subtitle="Decision support — verify against local protocols"
              right={
                <Badge
                  label={mode === "live" ? "Knowledge network" : "Demo engine"}
                  tone={mode === "live" ? "info" : "default"}
                />
              }
            />
            <View style={styles.countRow}><Text style={styles.count}>{result.matchCount}</Text><Text style={styles.countCaption}>similar cases{`\n`}matched to this profile</Text></View>
            <View style={styles.divider} /><Text style={styles.pathway}>{result.pathway.label}</Text>
            {result.pathway.steps.map((step, index) => <View style={styles.step} key={`${step}-${index}`}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View><Text style={styles.stepText}>{step}</Text></View>)}
            <View style={styles.stats}><Stat value={`${result.stats.recovery}%`} label="Recovery rate" color={c.success} /><Stat value={`${result.stats.stayDays} d`} label="Avg. stay" color={c.primary} /><Stat value={`${Math.round(result.stats.confidence * 100)}%`} label="Confidence" color={c.info} /></View>
            <Text style={styles.complicationTitle}>Potential complications</Text><View style={styles.complications}>{result.complications.map((item) => <Badge key={item} label={item} tone="warning" />)}</View>
          </Card>
          <SectionHeader title="Similar cases" subtitle="Anonymized · ranked by similarity" />
          <View style={styles.caseList}>{matches.map((item) => <Card key={item.caseId} style={styles.caseCard}><Text style={styles.hospital}>{item.hospital}</Text><Text style={styles.diagnosis}>{item.diagnosis}</Text><Text style={styles.caseAge}>{item.age}</Text><View style={styles.caseFooter}><Text style={styles.match}>{Math.round(item.match * 100)}% match</Text><Text style={styles.anonymized}>Anonymized</Text></View></Card>)}</View>
        </> : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) { return <View style={styles.stat}><Text style={[styles.statValue, { color }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background }, keyboard: { flex: 1 }, content: { padding: Spacing.three, paddingBottom: 132, gap: Spacing.three },
  hero: { flexDirection: "row", alignItems: "center", gap: Spacing.three }, heroIcon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: c.primaryDim }, heroCopy: { flex: 1 }, heroTitle: { color: c.text, fontSize: 21, fontWeight: "700" }, heroSubtitle: { color: c.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 3 },
  form: { gap: Spacing.three }, label: { color: c.text, fontSize: 14, fontWeight: "700" }, hint: { color: c.textMuted, fontSize: 11, marginTop: 2 }, optional: { color: c.textMuted, fontWeight: "400" }, ageRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, ageInput: { minWidth: 92, borderWidth: 1, borderColor: c.border, backgroundColor: c.cardElevated, borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, color: c.primary, fontSize: 20, fontWeight: "800", textAlign: "center" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two }, notes: { minHeight: 92, borderRadius: 12, backgroundColor: c.cardElevated, color: c.text, padding: Spacing.three, borderWidth: 1, borderColor: c.border, fontSize: 14 },
  recommendation: { gap: Spacing.three }, countRow: { flexDirection: "row", alignItems: "center", gap: Spacing.three }, count: { color: c.primary, fontSize: 50, fontWeight: "800" }, countCaption: { color: c.textSecondary, fontSize: 14, lineHeight: 20 }, divider: { height: 1, backgroundColor: c.border }, pathway: { color: c.text, fontSize: 17, fontWeight: "700" }, step: { flexDirection: "row", alignItems: "center", gap: Spacing.two }, stepNumber: { height: 26, width: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: c.primaryDim }, stepNumberText: { color: c.text, fontSize: 12, fontWeight: "700" }, stepText: { color: c.text, flex: 1, fontSize: 14, lineHeight: 20 }, stats: { flexDirection: "row", gap: Spacing.two }, stat: { flex: 1, alignItems: "center", paddingVertical: Spacing.two, borderRadius: 12, backgroundColor: c.cardElevated }, statValue: { fontSize: 18, fontWeight: "800" }, statLabel: { color: c.textSecondary, fontSize: 10, marginTop: 3 }, complicationTitle: { color: c.warning, fontSize: 13, fontWeight: "700" }, complications: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  caseList: { gap: Spacing.two }, caseCard: { gap: Spacing.one }, hospital: { color: c.textSecondary, fontSize: 12 }, diagnosis: { color: c.text, fontSize: 16, fontWeight: "700" }, caseAge: { color: c.textMuted, fontSize: 12 }, caseFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.two }, match: { color: c.primary, fontSize: 12, fontWeight: "700" }, anonymized: { color: c.success, fontSize: 12, fontWeight: "600" },
  aiLoading: { flexDirection: "row", alignItems: "center", gap: Spacing.two }, aiLoadingText: { color: c.textSecondary, fontSize: 13 }, summary: { color: c.text, fontSize: 15, lineHeight: 22 }, blockLabel: { color: c.textSecondary, fontSize: 12, fontWeight: "700", marginTop: Spacing.three, marginBottom: Spacing.two, textTransform: "uppercase", letterSpacing: 0.4 }, sourceNote: { color: c.textMuted, fontSize: 11, marginTop: Spacing.two }, fallbackRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two }, fallbackText: { color: c.textSecondary, fontSize: 12, flex: 1 },
});
