import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Spacing, Radii, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useSession } from "@/context/auth";
import { useCare } from "@/context/care";
import { useData } from "@/context/data";
import { GradientButton, Badge } from "@/components/ui";
import { getProtocol, type TriageOption, type TriageProtocol, type TriageResult, type Urgency } from "@/utils/triage-protocols";
import { routeProtocol, isUrgentText, extractSymptoms, matchAnswerOption, type TriageProfile, type ClaudeTriageHints } from "@/utils/triage-engine";
import { claudeConfigured, interpretTriageSymptoms } from "@/utils/claude";
import { similarCases } from "@/utils/cases";

type ChatKind = "question" | "result" | "info" | "clarify";

type ChatMessage = {
  id: number;
  role: "ai" | "user";
  kind: ChatKind;
  text: string;
  options?: TriageOption[];
  result?: TriageResult;
  protocolName?: string;
  stepIndex?: number;
  reasoning?: string;
};

const URGENCY_META: Record<
  Urgency,
  { tone: "success" | "warning" | "critical"; icon: keyof typeof Ionicons.glyphMap; color: ThemeColor }
> = {
  self_care: { tone: "success", icon: "checkmark-circle-outline", color: "success" },
  see_doctor_soon: { tone: "warning", icon: "calendar-outline", color: "warning" },
  seek_care_now: { tone: "critical", icon: "alert-circle-outline", color: "critical" },
};

const PROMPTS = ["I have a headache", "I have a fever", "There is pressure on my chest"];
let uid = 0;
const nextId = () => ++uid;

export default function PatientTriageScreen() {
  const { colors: c } = useTheme();
  const router = useRouter();
  const { session } = useSession();
  const { getPatient, getPrescriptions } = useCare();
  const { pastCases } = useData();

  const patientId = session?.patientId ?? "";
  const patient = getPatient(patientId);
  const medications = getPrescriptions(patientId).map((r) => r.drug);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [protocol, setProtocol] = useState<TriageProtocol | null>(null);
  const [visited, setVisited] = useState<string[]>([]);
  const [result, setResult] = useState<TriageResult | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const currentStepId = visited[visited.length - 1] ?? protocol?.firstStepId ?? "";
  const currentStep = protocol?.steps.find((s) => s.id === currentStepId);

  const profile: TriageProfile = {
    age: patient?.age ?? 30,
    gender: patient?.gender ?? undefined,
    conditions: patient?.conditions ?? [],
    allergies: patient?.allergies ?? [],
    medications,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const push = (msg: Omit<ChatMessage, "id">) =>
    setMessages((m) => [...m, { ...msg, id: nextId() }]);

  const pushUser = (text: string) => push({ role: "user", kind: "info", text });

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, thinking]);

  /** Route a fresh free-text description to a protocol (or a red-flag). */
  async function interpret(text: string): Promise<{ protocolId: TriageProtocol["id"] | null; urgent: boolean; reasoning?: string }> {
    const hints: ClaudeTriageHints | null = claudeConfigured()
      ? await interpretTriageSymptoms(text, profile)
      : null;
    if (hints?.protocol) {
      return { protocolId: hints.protocol, urgent: hints.urgent, reasoning: hints.reasoning };
    }
    const protocolId = routeProtocol(text);
    const urgent = protocolId ? isUrgentText(text, protocolId) : false;
    return { protocolId, urgent };
  }

  const urgentResultFor = (p: TriageProtocol): TriageResult | undefined =>
    p.results.find((r) => r.urgency === "seek_care_now");

  const startProtocol = (protocolId: TriageProtocol["id"], reasoning?: string) => {
    const p = getProtocol(protocolId);
    if (!p) return;
    setProtocol(p);
    setVisited([p.firstStepId]);
    setResult(null);
    if (reasoning) {
      push({ role: "ai", kind: "info", text: `${reasoning} I see what you mean — let's narrow it down.` });
    }
    pushQuestion(p, p.firstStepId, 1);
  };

  const showUrgent = (p: TriageProtocol | null | undefined, text: string) => {
    const protocolForUrgent = p ?? null;
    const r = (protocolForUrgent && urgentResultFor(protocolForUrgent)) ?? undefined;
    if (!r) {
      push({ role: "ai", kind: "info", text: "This sounds serious — please call emergency services (112) or get to the nearest hospital now." });
      return;
    }
    setProtocol(protocolForUrgent);
    setResult(r);
    push({ role: "ai", kind: "result", text: r.title, result: r, protocolName: protocolForUrgent?.name, reasoning: text });
  };

  const planResult = (option: TriageOption) => {
    if (!protocol || !option.resultId) return;
    const r = protocol.results.find((x) => x.id === option.resultId);
    if (!r) return;
    setResult(r);
    const knowledgeNote = buildKnowledgeNote(r);
    push({
      role: "ai",
      kind: "result",
      text: `${r.title}\n\n${r.advice}${knowledgeNote ? `\n\n${knowledgeNote}` : ""}`,
      result: r,
      protocolName: protocol.name,
      reasoning: `Based on your answers (${protocol.name} questions) I landed on \u201C${r.title}\u201D. ${r.advice}`,
    });
  };

  function buildKnowledgeNote(r: TriageResult): string | null {
    const stepContext = visited.map((id) => protocol?.steps.find((s) => s.id === id)?.question ?? "").join(" ");
    const symptoms = extractSymptoms(`${stepContext} ${r.title}`.replace(/_/g, " "));
    if (symptoms.length === 0) return null;
    const similar = similarCases(pastCases, {
      age: profile.age,
      symptoms,
      notes: `patient reported: ${symptoms.join(", ")}`,
    });
    const withMatch = similar.filter((s) => s.match > 0).slice(0, 2);
    if (withMatch.length === 0) return null;
    return (
      "I compared this with past cases in our records — the presentation most closely matches " +
      withMatch.map((s) => `${s.diagnosis.toLowerCase()} (${s.hospital.split(" · ")[0]})`).join(" and ") +
      ". Routine care is usually enough, but keep monitoring your symptoms."
    );
  }

  const advance = (option: TriageOption, label: string) => {
    pushUser(label);
    if (!protocol) return;
    if (option.nextStepId) {
      const nextStepId = option.nextStepId;
      setVisited((v) => [...v, nextStepId]);
      const nextIdx = protocol.steps.findIndex((s) => s.id === nextStepId);
      pushQuestion(protocol, nextStepId, nextIdx + 1);
    } else {
      planResult(option);
    }
  };

  const pushQuestion = (p: TriageProtocol, stepId: string, stepIndex: number) => {
    const step = p.steps.find((s) => s.id === stepId);
    if (!step) return;
    push({
      role: "ai",
      kind: "question",
      text: step.question,
      options: step.options,
      protocolName: p.name,
      stepIndex,
    });
  };

  /** Handle a user-typed message (either a fresh description or an answer). */
  async function send(text: string) {
    const value = text.trim();
    if (!value || thinking) return;
    setInput("");
    setThinking(true);
    try {
      // A result is showing — treat a new message as a fresh description.
      if (protocol && result) {
        setProtocol(null);
        setVisited([]);
        setResult(null);
      }
      pushUser(value);

      if (protocol && currentStep && result === null) {
        const idx = matchAnswerOption(value, currentStep.options);
        if (idx !== null) {
          advance(currentStep.options[idx], value);
        } else {
          push({
            role: "ai",
            kind: "clarify",
            text: "I didn't quite catch that from your options. Could you tap one of the answers below?",
            options: currentStep.options,
            protocolName: protocol.name,
            stepIndex: visited.length,
          });
        }
        return;
      }

      const { protocolId, urgent, reasoning } = await interpret(value);
      if (!protocolId) {
        push({
          role: "ai",
          kind: "clarify",
          text:
            "I couldn't clearly recognise those symptoms. Could you describe them in a simple way — a headache, a fever, chest pain, or something specific like \u201Csharp pain behind the eyes\u201D?",
        });
        return;
      }
      if (urgent) {
        showUrgent(getProtocol(protocolId), reasoning ?? "");
        return;
      }
      startProtocol(protocolId, reasoning);
    } finally {
      setThinking(false);
    }
  }

  const startOver = () => {
    setProtocol(null);
    setVisited([]);
    setResult(null);
    setMessages([]);
  };

  const handoffToPatientCare = () => {
    if (result?.urgency !== "seek_care_now") return;
    router.push({ pathname: "/patient/hospitals", params: { mode: "emergency" } });
  };

  const callEmergencyServices = () => {
    Linking.openURL("tel:112").catch(() => {});
  };

  const isPendingQuestion = (m: ChatMessage, index: number) =>
    m.kind === "question" && index === messages.length - 1;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={[styles.brandIcon, { backgroundColor: c.primary }]}>
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brandTitle, { color: c.text }]}>Symptoms & Care</Text>
              <Text style={[styles.brandSub, { color: c.textSecondary }]}>
                Clear next steps for how you feel
              </Text>
            </View>
            {messages.length > 1 ? <Pressable onPress={startOver} style={[styles.reset, { borderColor: c.border }]} accessibilityLabel="Start a new symptom check"><Ionicons name="refresh" size={17} color={c.primary} /></Pressable> : null}
          </View>

          {!protocol && !result && messages.length === 0 ? (
            <>
              <Pressable onPress={callEmergencyServices} style={[styles.emergencyCard, { backgroundColor: `${c.critical}12`, borderColor: `${c.critical}40` }]} accessibilityLabel="Call emergency services 112">
                <Ionicons name="warning-outline" size={21} color={c.critical} />
                <View style={{ flex: 1 }}><Text style={[styles.emergencyTitle, { color: c.critical }]}>Emergency warning signs?</Text><Text style={[styles.emergencyText, { color: c.textSecondary }]}>Severe chest pain, trouble breathing, fainting, stroke signs, or heavy bleeding: call 112 now.</Text></View>
                <Ionicons name="call-outline" size={19} color={c.critical} />
              </Pressable>
              <View style={styles.starterSection}>
                <Text style={[styles.starterTitle, { color: c.text }]}>What are you experiencing?</Text>
                <Text style={[styles.starterSub, { color: c.textSecondary }]}>Choose a common symptom or describe it below.</Text>
                <View style={styles.starterGrid}>
                  <SymptomStarter icon="headset-outline" label="Headache" color={c.info} onPress={() => send("I have a headache")} />
                  <SymptomStarter icon="thermometer-outline" label="Fever" color={c.warning} onPress={() => send("I have a fever")} />
                  <SymptomStarter icon="heart-outline" label="Chest pain" color={c.critical} onPress={() => send("There is pressure on my chest")} />
                  <SymptomStarter icon="cloud-outline" label="Cough & fever" color={c.accent} onPress={() => send("I have a cough and fever")} />
                  <SymptomStarter icon="fitness-outline" label="Breathing trouble" color={c.critical} onPress={() => send("I have chest tightness and difficulty breathing")} />
                  <SymptomStarter icon="chatbubble-ellipses-outline" label="Other symptoms" color={c.primary} onPress={() => setTimeout(() => inputRef.current?.focus(), 0)} />
                </View>
              </View>
            </>
          ) : null}

          {messages.map((m, index) => (
            <View key={m.id}>
              {m.role === "user" ? (
                <View style={[styles.userBubble, { backgroundColor: `${c.primary}22` }]}>
                  <Text style={[styles.userText, { color: c.text }]}>{m.text}</Text>
                </View>
              ) : (
                <View style={styles.aiWrap}>
                  <View style={[styles.aiIcon, { backgroundColor: `${c.primary}22` }]}>
                    <Ionicons name="medical-outline" size={14} color={c.primary} />
                  </View>
                  <View style={[styles.aiBody, { backgroundColor: c.card, borderColor: c.border }]}>
                    {m.kind === "result" && m.result && (
                      <>
                        <View style={styles.resultBadge}>
                          <Badge label={m.result.urgency === "self_care" ? "Home care" : m.result.urgency === "see_doctor_soon" ? "See a doctor soon" : "Seek care now"} tone={URGENCY_META[m.result.urgency].tone} />
                        </View>
                        <View style={styles.resultHead}>
                          <Ionicons name={URGENCY_META[m.result.urgency].icon} size={20} color={c[URGENCY_META[m.result.urgency].color]} />
                          <Text style={[styles.resultTitle, { color: c.text }]}>{m.result.title}</Text>
                        </View>
                        <Text style={[styles.aiText, { color: c.textSecondary }]}>{m.result.advice}</Text>
                      </>
                    )}
                    {m.kind === "question" && (
                      <>
                        <View style={styles.questionMeta}>
                          {m.protocolName && <Text style={[styles.protocolLabel, { color: c.primary }]}>{m.protocolName}</Text>}
                          {typeof m.stepIndex === "number" && protocol && (
                            <Text style={[styles.stepCount, { color: c.textMuted }]}>
                              Question {m.stepIndex} of {protocol.steps.length}
                            </Text>
                          )}
                        </View>
                        <Text style={[styles.aiText, { color: c.text }]}>{m.text}</Text>
                      </>
                    )}
                    {m.kind === "clarify" && <Text style={[styles.aiText, { color: c.text }]}>{m.text}</Text>}
                    {m.kind === "info" && <Text style={[styles.aiText, { color: c.textSecondary }]}>{m.text}</Text>}

                    {isPendingQuestion(m, index) && m.options?.map((o) => (
                      <Pressable
                        key={o.label}
                        onPress={() => advance(o, o.label)}
                        disabled={thinking}
                        style={({ pressed }) => [
                          styles.option,
                          {
                            borderColor: c.border,
                            backgroundColor: c.backgroundDim,
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                            opacity: thinking ? 0.6 : 1,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={o.label}
                      >
                        <Text style={[styles.optionText, { color: c.text }]}>{o.label}</Text>
                        <Ionicons name="chevron-forward" size={16} color={c.textSecondary} />
                      </Pressable>
                    ))}

                    {m.kind === "result" && m.result?.urgency === "seek_care_now" && (
                      <View style={styles.resultActions}>
                        <GradientButton label="Call 112" icon="call" onPress={callEmergencyServices} fullWidth />
                        <GradientButton
                          label="Find Nearest Hospital"
                          icon="business-outline"
                          variant="secondary"
                          onPress={handoffToPatientCare}
                          fullWidth
                        />
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))}

          {thinking && (
            <View style={styles.aiWrap}>
              <View style={[styles.aiIcon, { backgroundColor: `${c.primary}22` }]}>
                <Ionicons name="medical-outline" size={14} color={c.primary} />
              </View>
              <View style={[styles.typing, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.typingText, { color: c.textMuted }]}>MedNexus AI is thinking…</Text>
              </View>
            </View>
          )}

          {(messages.length > 0 || result) && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prompts} keyboardShouldPersistTaps="handled">
            {(result ? [] : PROMPTS).map((prompt) => (
              <Pressable key={prompt} onPress={() => send(prompt)} disabled={thinking} style={({ pressed }) => [styles.prompt, { borderColor: c.border, backgroundColor: c.card }, pressed && { opacity: 0.7 }]}>
                <Text style={[styles.promptText, { color: c.primary }]}>{prompt}</Text>
                <Ionicons name="arrow-up" size={14} color={c.primary} />
              </Pressable>
            ))}
            {result && (
              <Pressable onPress={startOver} disabled={thinking} style={({ pressed }) => [styles.prompt, { borderColor: c.border, backgroundColor: c.card }, pressed && { opacity: 0.7 }]}>
                <Text style={[styles.promptText, { color: c.primary }]}>Start over</Text>
                <Ionicons name="refresh" size={14} color={c.primary} />
              </Pressable>
            )}
          </ScrollView>}

          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={16} color={c.textMuted} />
            <Text style={[styles.disclaimerText, { color: c.textMuted }]}>
              This is a general guide only — not a substitute for professional medical advice. If this is an emergency, call 112.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.composerWrap}>
          <View style={[styles.composer, { backgroundColor: c.card, borderColor: c.border }]}>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send(input)}
              placeholder="Describe how you feel…"
              placeholderTextColor={c.textMuted}
              style={[styles.input, { color: c.text }]}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)}
              returnKeyType="send"
              multiline
            />
            <Pressable
              onPress={() => send(input)}
              disabled={!input.trim() || thinking}
              style={[styles.send, { backgroundColor: c.primary }, (!input.trim() || thinking) && { opacity: 0.4 }]}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SymptomStarter({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  const { colors: c } = useTheme();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.starter, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.75 : 1 }]}>
    <View style={[styles.starterIcon, { backgroundColor: `${color}18` }]}><Ionicons name={icon} size={20} color={color} /></View>
    <Text style={[styles.starterLabel, { color: c.text }]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: 96, gap: Spacing.three },

  brand: { flexDirection: "row", alignItems: "center", gap: Spacing.three, marginTop: Spacing.one },
  brandIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  brandTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  brandSub: { fontSize: 13, marginTop: 3 },
  reset: { width: 38, height: 38, borderWidth: 1, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  emergencyCard: { flexDirection: "row", alignItems: "center", gap: Spacing.two, borderRadius: Radii.lg, borderWidth: 1, padding: Spacing.three },
  emergencyTitle: { fontSize: 14, fontWeight: "800" }, emergencyText: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  starterSection: { gap: Spacing.one }, starterTitle: { fontSize: 16, fontWeight: "800" }, starterSub: { fontSize: 13, marginBottom: Spacing.one },
  starterGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two }, starter: { width: "48%", minHeight: 112, borderRadius: Radii.lg, borderWidth: 1, padding: Spacing.three, justifyContent: "space-between" }, starterIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" }, starterLabel: { fontSize: 14, fontWeight: "700" },

  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "86%",
    borderRadius: Radii.lg,
    borderBottomRightRadius: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  userText: { fontSize: 14, lineHeight: 20 },

  aiWrap: { flexDirection: "row", gap: Spacing.two, alignItems: "flex-start" },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  aiBody: {
    flex: 1,
    borderRadius: Radii.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  aiText: { fontSize: 14, lineHeight: 21 },

  resultBadge: { alignSelf: "flex-start" },
  resultHead: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  resultTitle: { fontSize: 16, fontWeight: "800", flex: 1 },

  questionMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  protocolLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  stepCount: { fontSize: 11 },

  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  optionText: { fontSize: 14, fontWeight: "600" },

  resultActions: { gap: Spacing.two, marginTop: Spacing.one },

  typing: { borderRadius: Radii.lg, borderWidth: 1, padding: Spacing.three },
  typingText: { fontSize: 13, fontStyle: "italic" },

  prompts: { gap: Spacing.two },
  prompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    borderRadius: Radii.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
  },
  promptText: { fontSize: 13, fontWeight: "700" },

  disclaimer: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.one },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },

  composerWrap: { paddingHorizontal: Spacing.three, paddingBottom: 88 },
  composer: {
    flexDirection: "row",
    gap: Spacing.two,
    alignItems: "flex-end",
    padding: Spacing.two,
    borderRadius: Radii.xl,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, maxHeight: 120 },
  send: { height: 42, width: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});
