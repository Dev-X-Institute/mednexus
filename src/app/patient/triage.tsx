import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Spacing, Radii, type ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Card, GradientButton, Badge } from "@/components/ui";
import {
  TRIAGE_PROTOCOLS,
  getProtocol,
  type TriageOption,
  type TriageProtocol,
  type TriageResult,
  type Urgency,
} from "@/utils/triage-protocols";

type Phase = "landing" | "question" | "result";

const URGENCY_META: Record<
  Urgency,
  { tone: "success" | "warning" | "critical"; icon: keyof typeof Ionicons.glyphMap; color: ThemeColor }
> = {
  self_care: { tone: "success", icon: "checkmark-circle-outline", color: "success" },
  see_doctor_soon: { tone: "warning", icon: "calendar-outline", color: "warning" },
  seek_care_now: { tone: "critical", icon: "alert-circle-outline", color: "critical" },
};

export default function PatientTriageScreen() {
  const { colors: c } = useTheme();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("landing");
  const [protocol, setProtocol] = useState<TriageProtocol | null>(null);
  const [visited, setVisited] = useState<string[]>([]);
  const [result, setResult] = useState<TriageResult | null>(null);

  const currentStepId = visited[visited.length - 1] ?? protocol?.firstStepId ?? "";
  const currentStep = protocol?.steps.find((s) => s.id === currentStepId);

  const startProtocol = (id: string) => {
    const p = getProtocol(id);
    if (!p) return;
    setProtocol(p);
    setVisited([p.firstStepId]);
    setResult(null);
    setPhase("question");
  };

  const chooseOption = (option: TriageOption) => {
    if (option.nextStepId) {
      const next = option.nextStepId;
      setVisited((v) => [...v, next]);
    } else if (option.resultId && protocol) {
      setResult(protocol.results.find((r) => r.id === option.resultId) ?? null);
      setPhase("result");
    }
  };

  const goBack = () => {
    if (visited.length > 1) {
      setVisited((v) => v.slice(0, v.length - 1));
    }
  };

  const handoffToPatientCare = () => {
    if (result?.urgency !== "seek_care_now") return;
    router.push("/patient/hospitals");
  };

  const startOver = () => {
    setProtocol(null);
    setVisited([]);
    setResult(null);
    setPhase("landing");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {phase === "landing" && (
          <View style={{ gap: Spacing.three }}>
            <View style={styles.hero}>
              <Text style={[styles.heroTitle, { color: c.text }]}>Check Your Symptoms</Text>
              <Text style={[styles.heroSub, { color: c.textSecondary }]}>
                Answer a few quick questions and we&apos;ll guide you to the right level
                of care.
              </Text>
            </View>

            <View style={styles.protocolList}>
              {TRIAGE_PROTOCOLS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => startProtocol(p.id)}
                  style={({ pressed }) => [
                    styles.protocolCard,
                    {
                      backgroundColor: c.card,
                      borderColor: c.border,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${p.name} triage`}
                >
                  <View style={[styles.protocolIcon, { backgroundColor: `${c.primary}22` }]}>
                    <Ionicons name={p.icon as keyof typeof Ionicons.glyphMap} size={24} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.protocolName, { color: c.text }]}>{p.name}</Text>
                    <Text style={[styles.protocolSteps, { color: c.textMuted }]}>
                      {p.steps.length} quick questions
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
                </Pressable>
              ))}
            </View>

            <Disclaimer colors={c} />
          </View>
        )}

        {phase === "question" && protocol && currentStep && (
          <View style={{ gap: Spacing.three }}>
            <View style={styles.questionHeader}>
              <Pressable
                onPress={goBack}
                disabled={visited.length <= 1}
                style={({ pressed }) => [
                  styles.backBtn,
                  {
                    backgroundColor: c.card,
                    borderColor: c.border,
                    opacity: visited.length <= 1 ? 0.4 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Back to previous question"
              >
                <Ionicons name="arrow-back" size={20} color={c.text} />
              </Pressable>

              <View style={styles.progressDots}>
                {protocol.steps.map((s) => {
                  const idx = protocol.steps.indexOf(s);
                  const done = idx < visited.length - 1;
                  const active = s.id === currentStep.id;
                  return (
                    <View
                      key={s.id}
                      style={[
                        styles.progressDot,
                        {
                          backgroundColor: active
                            ? c.primary
                            : done
                              ? `${c.primary}55`
                              : c.border,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              <Text style={[styles.stepCount, { color: c.textMuted }]}>
                Step {visited.length} of {protocol.steps.length}
              </Text>
            </View>

            <Text style={[styles.question, { color: c.text }]}>{currentStep.question}</Text>

            <View style={styles.options}>
              {currentStep.options.map((o) => (
                <Pressable
                  key={o.label}
                  onPress={() => chooseOption(o)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: c.card,
                      borderColor: c.border,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={o.label}
                >
                  <Text style={[styles.optionText, { color: c.text }]}>{o.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
                </Pressable>
              ))}
            </View>

            <Disclaimer colors={c} />
          </View>
        )}

        {phase === "result" && protocol && result && (
          <View style={{ gap: Spacing.three }}>
            <View style={styles.resultTop}>
              <Badge label={result.urgency === "self_care" ? "Home care" : result.urgency === "see_doctor_soon" ? "See a doctor soon" : "Seek care now"} tone={URGENCY_META[result.urgency].tone} />
            </View>

            <Card variant="elevated" style={styles.resultCard}>
              <View style={[styles.resultIcon, { backgroundColor: `${c[URGENCY_META[result.urgency].color]}22` }]}>
                <Ionicons name={URGENCY_META[result.urgency].icon} size={32} color={c[URGENCY_META[result.urgency].color]} />
              </View>
              <Text style={[styles.resultTitle, { color: c.text }]}>{result.title}</Text>
              <Text style={[styles.resultAdvice, { color: c.textSecondary }]}>{result.advice}</Text>
            </Card>

            {result.urgency === "seek_care_now" && (
              <GradientButton label="Find Nearest Hospital" icon="business-outline" onPress={handoffToPatientCare} fullWidth />
            )}
            <GradientButton label="Start Over" icon="refresh-outline" variant="ghost" onPress={startOver} fullWidth />

            <Disclaimer colors={c} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Disclaimer({ colors: c }: { colors: Record<ThemeColor, string> }) {
  return (
    <View style={styles.disclaimer}>
      <Ionicons name="information-circle-outline" size={16} color={c.textMuted} />
      <Text style={[styles.disclaimerText, { color: c.textMuted }]}>
        This is a general guide only — not a substitute for professional medical advice.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },

  hero: { gap: Spacing.one },
  heroTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { fontSize: 14, lineHeight: 20 },

  protocolList: { gap: Spacing.two },
  protocolCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.three,
  },
  protocolIcon: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  protocolName: { fontSize: 16, fontWeight: "700" },
  protocolSteps: { fontSize: 12, marginTop: 2 },

  questionHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressDots: { flex: 1, flexDirection: "row", gap: 6 },
  progressDot: { width: 8, height: 8, borderRadius: Radii.pill },
  stepCount: { fontSize: 12, fontWeight: "600" },

  question: { fontSize: 20, fontWeight: "700", lineHeight: 28 },

  options: { gap: Spacing.two },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  optionText: { fontSize: 15, fontWeight: "600", flex: 1 },

  resultTop: { alignItems: "flex-start" },
  resultCard: { alignItems: "center", gap: Spacing.two, paddingVertical: Spacing.four },
  resultIcon: {
    width: 64,
    height: 64,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  resultAdvice: { fontSize: 14, lineHeight: 21, textAlign: "center" },

  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});