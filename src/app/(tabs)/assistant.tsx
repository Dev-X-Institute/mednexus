import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { Card, Badge } from "@/components/ui";
import { useSession } from "@/context/session";

const c = Colors.light;
const PROMPTS = ["Why is the ER overloaded?", "What needs attention today?", "Summarise ICU capacity"];

export default function AssistantScreen() {
  const { session } = useSession();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const hospital = session?.hospital ?? "Korle Bu Teaching Hospital";
  const ask = (value = question) => {
    if (!value.trim()) return;
    setAnswer("Current signals point to sustained emergency demand and limited inpatient headroom. Review the ER queue, confirm Ward B discharge readiness, and protect ICU capacity before elective admissions. This operational summary is simulated and should be verified with the care team.");
    setQuestion("");
  };

  return <SafeAreaView style={styles.safe} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.brand}><View style={styles.brandIcon}><Ionicons name="sparkles-outline" size={25} color="#FFFFFF" /></View><View><Text style={styles.title}>Hospital Assistant</Text><Text style={styles.subtitle}>Operations · forecasts · case recall</Text></View></View>
      <Card style={styles.welcome}><Text style={styles.welcomeText}>Good afternoon, Dr. Ama Osei. I’m connected to <Text style={styles.emphasis}>{hospital}</Text>’s simulated operations workspace and anonymized clinical learning network. Ask about flow, capacity, inventory, or case recall.</Text><View style={styles.statusRow}><Badge label="Demo data" tone="info" /><Text style={styles.statusText}>Clinical decisions remain with your team</Text></View></Card>
      {answer ? <Card style={styles.answer}><View style={styles.answerHead}><Ionicons name="sparkles" size={17} color={c.accent} /><Text style={styles.answerTitle}>Operational brief</Text></View><Text style={styles.answerText}>{answer}</Text></Card> : null}
      <Text style={styles.promptTitle}>Try asking</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prompts}>{PROMPTS.map((prompt) => <Pressable key={prompt} onPress={() => ask(prompt)} style={styles.prompt}><Text style={styles.promptText}>{prompt}</Text><Ionicons name="arrow-up-outline" size={14} color={c.primary} /></Pressable>)}</ScrollView>
    </ScrollView>
    <View style={styles.composer}><TextInput value={question} onChangeText={setQuestion} onSubmitEditing={() => ask()} placeholder="Ask the hospital assistant…" placeholderTextColor={c.textMuted} style={styles.input} returnKeyType="send" /><Pressable onPress={() => ask()} style={[styles.send, !question.trim() && styles.sendDisabled]}><Ionicons name="arrow-up" size={20} color="#FFFFFF" /></Pressable></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background }, content: { padding: Spacing.three, paddingBottom: 150, gap: Spacing.three },
  brand: { flexDirection: "row", alignItems: "center", gap: Spacing.three, marginTop: Spacing.one }, brandIcon: { width: 54, height: 54, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: c.primary }, title: { color: c.text, fontSize: 22, fontWeight: "800" }, subtitle: { color: c.textSecondary, fontSize: 13, marginTop: 3 },
  welcome: { gap: Spacing.three }, welcomeText: { color: c.text, fontSize: 17, lineHeight: 25 }, emphasis: { fontWeight: "800", color: c.primary }, statusRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two }, statusText: { color: c.textMuted, fontSize: 11, flex: 1 },
  promptTitle: { color: c.text, fontSize: 15, fontWeight: "800", marginTop: Spacing.two }, prompts: { gap: Spacing.two, paddingRight: Spacing.three }, prompt: { flexDirection: "row", alignItems: "center", gap: Spacing.two, borderColor: c.border, borderWidth: 1, backgroundColor: c.card, borderRadius: Radii.pill, paddingHorizontal: Spacing.three, paddingVertical: 10 }, promptText: { color: c.primary, fontSize: 13, fontWeight: "700" },
  answer: { gap: Spacing.two, borderColor: "#B9E6E1" }, answerHead: { flexDirection: "row", alignItems: "center", gap: Spacing.one }, answerTitle: { color: c.text, fontWeight: "800", fontSize: 15 }, answerText: { color: c.textSecondary, fontSize: 14, lineHeight: 21 },
  composer: { position: "absolute", left: Spacing.three, right: Spacing.three, bottom: 92, flexDirection: "row", gap: Spacing.two, alignItems: "center", padding: Spacing.two, borderRadius: Radii.xl, backgroundColor: c.card, borderColor: c.border, borderWidth: 1, shadowColor: "#0F172A", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 4 }, input: { flex: 1, color: c.text, fontSize: 15, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two }, send: { height: 42, width: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: c.primary }, sendDisabled: { backgroundColor: c.textMuted },
});
