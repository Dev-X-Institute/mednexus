import { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  type TextProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

import { Colors, Spacing } from "@/constants/theme";
import { Skeleton } from "@/components/skeleton";
import { getCases, getCaseById, formatDate } from "@/utils/cases";
import type { PastCase } from "@/utils/cases";

interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

function highlightIn(text: string, query: string): HighlightSegment[] {
  const q = query.trim().toLowerCase();
  if (!q) return [{ text, highlighted: false }];
  const lower = text.toLowerCase();
  const segments: HighlightSegment[] = [];
  let index = 0;
  while (index < text.length) {
    const at = lower.indexOf(q, index);
    if (at === -1) {
      segments.push({ text: text.slice(index), highlighted: false });
      break;
    }
    if (at > index) {
      segments.push({ text: text.slice(index, at), highlighted: false });
    }
    segments.push({ text: text.slice(at, at + q.length), highlighted: true });
    index = at + q.length;
  }
  return segments;
}

function HighlightedText({
  text,
  query,
  highlightedStyle,
  numberOfLines,
  ...props
}: TextProps & {
  text: string;
  query: string;
  highlightedStyle?: object;
}) {
  const segments = highlightIn(text, query);
  return (
    <Text {...props} numberOfLines={numberOfLines}>
      {segments.map((seg, i) => (
        <Text
          key={i}
          style={seg.highlighted ? highlightedStyle : undefined}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  );
}

function CaseCard({
  c,
  query,
  onPress,
  highlightColor,
  colors,
}: {
  c: PastCase;
  query: string;
  onPress: () => void;
  highlightColor: string;
  colors: { text: string; textSecondary: string; primary: string; card: string; border: string; backgroundElement: string };
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* header row: id + tags */}
      <View style={styles.cardHeader}>
        <Text style={[styles.caseId, { color: colors.textSecondary }]}>{c.id}</Text>
        <View style={styles.tagRow}>
          {c.tags.slice(0, 3).map((t) => (
            <View key={t} style={[styles.tagPill, { backgroundColor: `${colors.primary}18` }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* diagnosis */}
      <HighlightedText
        text={c.diagnosis}
        query={query}
        highlightedStyle={[styles.diagnosisHighlight, { backgroundColor: highlightColor }]}
        style={[styles.diagnosis, { color: colors.text }]}
        numberOfLines={2}
      />

      {/* matched symptoms */}
      <View style={styles.symptomChips}>
        {c.symptoms.map((s) => {
          const matched = highlightIn(s, query).some((seg) => seg.highlighted);
          return (
            <View
              key={s}
              style={[
                styles.symptomChip,
                { backgroundColor: colors.backgroundElement },
                matched && { backgroundColor: highlightColor },
              ]}
            >
              <HighlightedText
                text={s}
                query={query}
                highlightedStyle={styles.symptomHighlight}
                style={[styles.symptomText, { color: colors.text }]}
              />
            </View>
          );
        })}
      </View>

      {/* outcome */}
      <View style={styles.outcomeRow}>
        <Ionicons name="checkmark-circle-outline" size={14} color="#15803D" />
        <HighlightedText
          text={c.outcome}
          query={query}
          highlightedStyle={styles.symptomHighlight}
          style={[styles.outcome, { color: colors.textSecondary }]}
          numberOfLines={2}
        />
      </View>
    </TouchableOpacity>
  );
}

function DetailSection({
  icon,
  title,
  children,
  primary,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  primary: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <View style={styles.detailSectionHeader}>
        <Ionicons name={icon} size={16} color={primary} />
        <Text style={[styles.detailSectionTitle, { color: text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function DetailModal({
  c,
  onClose,
  colors,
  primary,
}: {
  c: PastCase;
  onClose: () => void;
  colors: { text: string; textSecondary: string; card: string; border: string; background: string; backgroundElement: string };
  primary: string;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.caseIdWrap}>
              <Text style={[styles.modalCaseId, { color: colors.textSecondary }]}>{c.id}</Text>
              <View style={styles.tagRow}>
                {c.tags.map((t) => (
                  <View key={t} style={[styles.tagPill, { backgroundColor: `${primary}18` }]}>
                    <Text style={[styles.tagText, { color: primary }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.backgroundElement }]} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalBody}
          >
            <Text style={[styles.detailDiagnosis, { color: colors.text }]}>{c.diagnosis}</Text>

            {/* meta row */}
            <View style={styles.metaGrid}>
              <View style={[styles.metaCell, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Patient</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {c.patientGender}, {c.patientAge}
                </Text>
              </View>
              <View style={[styles.metaCell, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Admitted</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{formatDate(c.admissionDate)}</Text>
              </View>
              <View style={[styles.metaCell, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Discharged</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{formatDate(c.dischargeDate)}</Text>
              </View>
            </View>

            <DetailSection icon="body-outline" title="Symptoms" primary={primary} text={colors.text}>
              <View style={styles.detailChipList}>
                {c.symptoms.map((s) => (
                  <View key={s} style={[styles.detailChip, { backgroundColor: colors.backgroundElement }]}>
                    <Text style={[styles.detailChipText, { color: colors.text }]}>• {s}</Text>
                  </View>
                ))}
              </View>
            </DetailSection>

            <DetailSection icon="bandage-outline" title="Treatment" primary={primary} text={colors.text}>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{c.treatment}</Text>
            </DetailSection>

            <DetailSection icon="checkmark-done-outline" title="Outcome" primary={primary} text={colors.text}>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{c.outcome}</Text>
            </DetailSection>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ClinicalMemoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const results = useMemo(() => getCases(query), [query]);
  const selectedCase = selectedId ? getCaseById(selectedId) : undefined;

  const highlightColor =
    colorScheme === "dark" ? "#134E4A55" : "#CCFBF1";
  const primary = colors.primary;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setSearching(true);
    const t = setTimeout(() => setSearching(false), 200);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* search bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card }]}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search symptoms or tags…"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* results header */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsLabel, { color: colors.textSecondary }]}>
          {query.trim()
            ? `${results.length} result${results.length === 1 ? "" : "s"}`
            : "All recorded cases"}
        </Text>
        {searching && !loading && (
          <View style={styles.searchingRow}>
            <ActivityIndicator size="small" color={colors.primary} style={styles.searchSpinner} />
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {results.length}
            </Text>
          </View>
        )}
        {!searching && !loading && (
          <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
            {results.length}
          </Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.cards}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.card, { borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Skeleton width={70} height={12} />
                  <Skeleton width={90} height={18} />
                </View>
                <Skeleton width="80%" height={16} />
                <Skeleton width="95%" height={16} />
                <View style={styles.symptomChips}>
                  {[0, 1, 2].map((j) => (
                    <Skeleton key={j} width={70 + j * 22} height={22} radius={6} />
                  ))}
                </View>
                <Skeleton width="60%" height={13} />
              </View>
            ))}
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.backgroundElement }]}>
              <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No matching cases
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              No cases matched "{query}". Try a symptom like "chest pain" or a tag like "cardiac".
            </Text>
          </View>
        ) : (
          <View style={styles.cards}>
            {results.map((c) => (
              <CaseCard
                key={c.id}
                c={c}
                query={query}
                highlightColor={highlightColor}
                colors={colors}
                onPress={() => setSelectedId(c.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {selectedCase && (
        <DetailModal c={selectedCase} colors={colors} primary={primary} onClose={() => setSelectedId(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.five },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    height: 44,
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  resultsLabel: { fontSize: 13, fontWeight: "500" },
  resultsCount: { fontSize: 13, fontWeight: "700" },

  searchingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.one },
  searchSpinner: { transform: [{ scale: 0.8 }] },

  cards: { gap: Spacing.two },
  card: {
    borderRadius: 10,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  caseId: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  tagRow: { flexDirection: "row", gap: Spacing.one, flexShrink: 1, flexWrap: "wrap" },
  tagPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: { fontSize: 10, fontWeight: "600" },

  diagnosis: { fontSize: 16, fontWeight: "600", lineHeight: 20 },
  diagnosisHighlight: { borderRadius: 2 },

  symptomChips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  symptomChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 6,
    overflow: "hidden",
  },
  symptomText: { fontSize: 12 },
  symptomHighlight: { fontWeight: "700" },

  outcomeRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.two },
  outcome: { flex: 1, fontSize: 12, lineHeight: 17 },

  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "600" },
  emptySubtitle: { fontSize: 14, lineHeight: 20, textAlign: "center" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  caseIdWrap: { flex: 1, gap: Spacing.two },
  modalCaseId: { fontSize: 12, fontWeight: "700", letterSpacing: 0.4 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: { padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  detailDiagnosis: { fontSize: 20, fontWeight: "700", lineHeight: 26 },

  metaGrid: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  metaCell: { flex: 1, borderRadius: 8, padding: 10 },
  metaLabel: { fontSize: 11, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: "600" },

  detailSection: { gap: Spacing.two },
  detailSectionHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  detailSectionTitle: { fontSize: 13, fontWeight: "700" },
  detailChipList: { gap: Spacing.two },
  detailChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Spacing.two,
  },
  detailChipText: { fontSize: 14, lineHeight: 20 },
  bodyText: { fontSize: 14, lineHeight: 21 },
});
