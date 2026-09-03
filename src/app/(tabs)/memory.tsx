import { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing } from "@/constants/theme";
import { Card, SectionHeader, Chip, GradientButton, Badge } from "@/components/ui";
import { matchPatientProfile, similarCases } from "@/utils/cases";

const c = Colors.light;
const SYMPTOMS = ["Fever", "Chest pain", "Dyspnea", "Kidney injury", "Hypertension", "Hypotension", "Cough", "Abdominal pain", "Headache", "Fatigue", "Tachycardia", "Confusion"];

export default function MemoryScreen() {
  const [age, setAge] = useState(45);
  const [selected, setSelected] = useState<string[]>(["Fever", "Hypertension"]);
  const [notes, setNotes] = useState("");
  const [searched, setSearched] = useState(false);
  const profile = useMemo(() => ({ age, symptoms: selected, notes }), [age, selected, notes]);
  const result = useMemo(() => matchPatientProfile(profile), [profile]);
  const matches = useMemo(() => similarCases(profile), [profile]);
  const updateAge = (delta: number) => { setAge((value) => Math.max(1, Math.min(100, value + delta))); setSearched(false); };
  const toggle = (symptom: string) => { setSelected((items) => items.includes(symptom) ? items.filter((item) => item !== symptom) : [...items, symptom]); setSearched(false); };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="library-outline" size={27} color={c.text} /></View>
          <View style={styles.heroCopy}><Text style={styles.heroTitle}>AI Doctor Memory</Text><Text style={styles.heroSubtitle}>Search anonymized clinical patterns across 34 hospitals</Text></View>
        </Card>
        <Card style={styles.form}>
          <SectionHeader title="Patient profile" subtitle="Use de-identified clinical information only" />
          <View style={styles.ageRow}><View><Text style={styles.label}>Age</Text><Text style={styles.hint}>Adjust in 5-year steps</Text></View><View style={styles.ageControl}><GradientButton label="−" variant="secondary" onPress={() => updateAge(-5)} style={styles.ageButton} /><Text style={styles.ageValue}>{age} y</Text><GradientButton label="+" variant="secondary" onPress={() => updateAge(5)} style={styles.ageButton} /></View></View>
          <Text style={styles.label}>Symptoms & conditions</Text>
          <View style={styles.chips}>{SYMPTOMS.map((symptom) => <Chip key={symptom} label={symptom} selected={selected.includes(symptom)} onPress={() => toggle(symptom)} />)}</View>
          <Text style={styles.label}>Clinical notes <Text style={styles.optional}>optional</Text></Text>
          <TextInput value={notes} onChangeText={(value) => { setNotes(value); setSearched(false); }} placeholder="Labs, imaging, history, or current concern…" placeholderTextColor={c.textMuted} multiline textAlignVertical="top" style={styles.notes} />
          <GradientButton label="Search Knowledge Network" icon="search-outline" fullWidth onPress={() => setSearched(true)} />
        </Card>
        {searched ? <>
          <Card style={styles.recommendation}>
            <SectionHeader title="AI recommendation" subtitle="Decision support — verify against local protocols" />
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
    </SafeAreaView>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) { return <View style={styles.stat}><Text style={[styles.statValue, { color }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background }, content: { padding: Spacing.three, paddingBottom: 132, gap: Spacing.three },
  hero: { flexDirection: "row", alignItems: "center", gap: Spacing.three }, heroIcon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: c.primaryDim }, heroCopy: { flex: 1 }, heroTitle: { color: c.text, fontSize: 21, fontWeight: "700" }, heroSubtitle: { color: c.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 3 },
  form: { gap: Spacing.three }, label: { color: c.text, fontSize: 14, fontWeight: "700" }, hint: { color: c.textMuted, fontSize: 11, marginTop: 2 }, optional: { color: c.textMuted, fontWeight: "400" }, ageRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, ageControl: { flexDirection: "row", alignItems: "center", gap: Spacing.one }, ageButton: { height: 36, minWidth: 36, paddingHorizontal: 0 }, ageValue: { color: c.primary, fontSize: 20, fontWeight: "700", minWidth: 48, textAlign: "center" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two }, notes: { minHeight: 92, borderRadius: 12, backgroundColor: c.cardElevated, color: c.text, padding: Spacing.three, borderWidth: 1, borderColor: c.border, fontSize: 14 },
  recommendation: { gap: Spacing.three }, countRow: { flexDirection: "row", alignItems: "center", gap: Spacing.three }, count: { color: c.primary, fontSize: 50, fontWeight: "800" }, countCaption: { color: c.textSecondary, fontSize: 14, lineHeight: 20 }, divider: { height: 1, backgroundColor: c.border }, pathway: { color: c.text, fontSize: 17, fontWeight: "700" }, step: { flexDirection: "row", alignItems: "center", gap: Spacing.two }, stepNumber: { height: 26, width: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: c.primaryDim }, stepNumberText: { color: c.text, fontSize: 12, fontWeight: "700" }, stepText: { color: c.text, flex: 1, fontSize: 14, lineHeight: 20 }, stats: { flexDirection: "row", gap: Spacing.two }, stat: { flex: 1, alignItems: "center", paddingVertical: Spacing.two, borderRadius: 12, backgroundColor: c.cardElevated }, statValue: { fontSize: 18, fontWeight: "800" }, statLabel: { color: c.textSecondary, fontSize: 10, marginTop: 3 }, complicationTitle: { color: c.warning, fontSize: 13, fontWeight: "700" }, complications: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  caseList: { gap: Spacing.two }, caseCard: { gap: Spacing.one }, hospital: { color: c.textSecondary, fontSize: 12 }, diagnosis: { color: c.text, fontSize: 16, fontWeight: "700" }, caseAge: { color: c.textMuted, fontSize: 12 }, caseFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.two }, match: { color: c.primary, fontSize: 12, fontWeight: "700" }, anonymized: { color: c.success, fontSize: 12, fontWeight: "600" },
});
