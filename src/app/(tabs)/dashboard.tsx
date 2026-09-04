import { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { Radii, Spacing, Colors } from "@/constants/theme";
import { useSession } from "@/context/auth";
import { useDemo } from "@/context/demo";
import { useData } from "@/context/data";
import {
  Card,
  SectionHeader,
  RingGauge,
  MetricCard,
  GradientButton,
  Badge,
  ProgressBar,
  StatTile,
  Sparkline,
} from "@/components/ui";
import { capacityPercent, formatCapacity, trendDirection } from "@/utils/predictions";

const c = Colors.light;

export default function DashboardScreen() {
  const { session } = useSession();
  const { width } = useWindowDimensions();
  const { admissions, bloodBank, staff, theatreSchedule, recommendations: recommendationsData, predictions } = useData();
  const { mode } = useDemo();
  // Screen padding (16 × 2) + Card padding (16 × 2); divide the remaining
  // space between all three gauges to prevent horizontal overflow.
  const gaugeSize = Math.min(112, Math.max(64, Math.floor((width - 64) / 3)));

  const daily = admissions;
  const last = daily[daily.length - 1];
  const occupancyPct = capacityPercent(last.occupancy);
  const icuPct = Math.round((last.icuOccupancy / 30) * 100);

  const occupancySeries = daily.map((d) => d.occupancy);
  const erSeries = daily.map((d) => d.emergencyVisits);

  const bloodReserve = useMemo(
    () =>
      bloodBank.map((e) => ({
        ...e,
        pct: Math.round((e.unit / e.capacity) * 100),
      })),
    [bloodBank]
  );

  const onDuty = staff.filter((s) => s.onDuty);
  const staffByDept: Record<string, number> = {};
  for (const s of onDuty) staffByDept[s.department] = (staffByDept[s.department] ?? 0) + 1;

  const availability = onDuty.slice(0, 5);

  const [recommendations, setRecommendations] = useState(recommendationsData);

  const statusToneFor = (v: number) =>
    v >= 85 ? "critical" : v >= 60 ? "warning" : "success";

  const erTrend = trendDirection(erSeries);
  const erDeltaTone = erTrend === "flat" ? "neutral" : erTrend;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting header */}
        <View style={styles.header}>
          <View style={styles.greetingBlock}>
            <Text style={[styles.greeting, { color: c.textSecondary }]}>Good evening,</Text>
            <Text style={[styles.userName, { color: c.text }]} numberOfLines={1}>
              {session?.userName ?? "Dr. Ama Osei"}
            </Text>
            <Text style={[styles.hospital, { color: c.textMuted }]} numberOfLines={1}>
              {session?.hospital ?? "Korle Bu Teaching Hospital"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.livePill}>
              <View style={[styles.liveDot, { backgroundColor: c.success }]} />
              <Text style={[styles.liveText, { color: c.success }]}>LIVE</Text>
            </View>
            <TouchableOpacity style={[styles.bellBtn, { backgroundColor: c.card }]}>
              <Ionicons name="notifications-outline" size={20} color={c.text} />
              <View style={[styles.bellDot, { backgroundColor: c.critical }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Ring gauge card: Beds / ICU / ER queue */}
        <Card style={styles.gaugeCard}>
          <SectionHeader
            title="Capacity Overview"
            subtitle={`Updated ${formatCapacity(occupancyPct)} · live`}
            right={<Badge label="Live ops" tone="success" />}
          />
          <View style={styles.gaugeRow}>
            <RingGauge
              value={occupancyPct}
              size={gaugeSize}
              strokeWidth={9}
              tone={statusToneFor(occupancyPct) as any}
              centerLabel={`${occupancyPct}%`}
              centerCaption="Bed occ"
              accessibilityLabel={`Bed occupancy, ${occupancyPct} percent of ${last.occupancy} of 200 beds`}
              delay={0}
            />
            <RingGauge
              value={icuPct}
              size={gaugeSize}
              strokeWidth={9}
              tone={icuPct >= 75 ? ("warning" as any) : ("primary" as any)}
              centerLabel={`${icuPct}%`}
              centerCaption="ICU"
              accessibilityLabel={`ICU occupancy, ${icuPct} percent of ${last.icuOccupancy} of 30 beds`}
              delay={80}
            />
            <RingGauge
              value={Math.min(100, (last.emergencyVisits / 50) * 100)}
              size={gaugeSize}
              strokeWidth={9}
              tone="warning"
              centerLabel={`${last.emergencyVisits}`}
              centerCaption="ER queue"
              accessibilityLabel={`Emergency room queue, ${last.emergencyVisits} patients waiting`}
              delay={160}
            />
          </View>

          {/* Blood bank reserve row */}
          <View style={styles.bloodHeader}>
            <Text style={[styles.bloodTitle, { color: c.text }]}>Blood Bank Reserve</Text>
            <Sparkline data={erSeries} height={22} width={64} color={c.critical} />
          </View>
          <View style={styles.bloodRow}>
            {bloodReserve.slice(0, 8).map((e) => (
              <StatTile
                key={e.id}
                label={e.group}
                value={`${e.unit}`}
                tone={e.pct < 40 ? c.critical : e.pct < 60 ? c.warning : c.success}
                style={styles.bloodTile}
              />
            ))}
          </View>
        </Card>

        {/* Operations metric cards */}
        <SectionHeader
          title="Operations"
          subtitle="Live metrics across the hospital"
          right={<Badge label="4 live" tone="info" />}
          style={styles.section}
        />
        <View style={styles.opsGrid}>
          <MetricCard
            style={styles.opsCard}
            icon="bed-outline"
            label="Bed occupancy"
            value={`${formatCapacity(occupancyPct)}`}
            delta={`${last.occupancy}/200 beds`}
            deltaTone="neutral"
            statusTone={statusToneFor(occupancyPct)}
            spark={occupancySeries.slice(-9)}
            accessibilityLabel={`Bed occupancy, ${formatCapacity(occupancyPct)}, ${last.occupancy} of 200 beds occupied`}
          />
          <MetricCard
            style={styles.opsCard}
            icon="pulse-outline"
            label="ER admissions"
            value={`${last.admissions}`}
            delta={`${trendDirection(erSeries) === "up" ? "+" : ""}${Math.round(
              (erSeries[erSeries.length - 1] / erSeries[0] - 1) * 100
            )}% vs trend`}
            deltaTone={erDeltaTone}
            statusTone="warning"
            spark={erSeries.slice(-9)}
            accessibilityLabel={`ER admissions, ${last.admissions} today`}
          />
          <MetricCard
            style={styles.opsCard}
            icon="people-outline"
            label="On duty"
            value={`${onDuty.length}`}
            delta={`${Object.keys(staffByDept).length} departments`}
            deltaTone="neutral"
            statusTone="success"
            accessibilityLabel={`Staff on duty, ${onDuty.length} across ${Object.keys(staffByDept).length} departments`}
          />
          <MetricCard
            style={styles.opsCard}
            icon="medical-outline"
            label="Pharmacy alerts"
            value={`3`}
            delta="needs review"
            deltaTone="down"
            statusTone="critical"
            spark={[4, 4, 3, 5, 3, 3, 3]}
            accessibilityLabel={`Pharmacy alerts, 3 items need review`}
          />
        </View>

        {/* AI Predictions */}
        <SectionHeader
          title="AI Predictions"
          subtitle={
            mode === "live"
              ? "Real regression on today's admissions data"
              : "Confidence-scored forecasts"
          }
          right={
            <Badge
              label={mode === "live" ? "Live" : "Demo"}
              tone={mode === "live" ? "info" : "default"}
            />
          }
          style={styles.section}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.predictionRow}
        >
          {predictions.map((p) => (
            <Card key={p.id} style={styles.predictionCard}>
              <View style={styles.predictTop}>
                <Text style={[styles.predictTitle, { color: c.textSecondary }]}>{p.title}</Text>
                <Ionicons
                  name={
                    p.direction === "up"
                      ? "trending-up"
                      : p.direction === "down"
                        ? "trending-down"
                        : "remove"
                  }
                  size={16}
                  color={
                    p.direction === "up" ? c.critical : p.direction === "down" ? c.success : c.textMuted
                  }
                />
              </View>
              <Text style={[styles.predictValue, { color: c.text }]}>{p.value}</Text>
              <Text style={[styles.predictRange, { color: c.textMuted }]}>
                forecast {p.period}
              </Text>
              <Text style={[styles.predictDelta, { color: c.textSecondary }]}>
                {p.delta} · {p.over}
              </Text>
              <View style={styles.confidenceRow}>
                <ProgressBar
                  label="Confidence"
                  valueLabel={`${Math.round(p.confidence * 100)}%`}
                  progress={p.confidence}
                  color={
                    p.confidence >= 0.8 ? c.success : p.confidence >= 0.7 ? c.warning : c.critical
                  }
                  height={6}
                  style={styles.confidenceBar}
                />
              </View>
            </Card>
          ))}
        </ScrollView>

        {/* Smart Resource Allocation */}
        <SectionHeader
          title="Smart Resource Allocation"
          subtitle="AI-suggested actions"
          right={<Badge label="Live" tone="success" />}
          style={styles.section}
        />
        <View style={styles.resourceList}>
          {recommendations.map((r) => (
            <Card key={r.id} style={[styles.resourceCard, r.applied && styles.resourceApplied]}>
              <View style={styles.resourceTop}>
                <View style={styles.resourceCatRow}>
                  <Badge label={r.category} tone="info" />
                  <Badge
                    label={r.impact}
                    tone={r.impact === "high" ? "critical" : r.impact === "medium" ? "warning" : "info"}
                  />
                </View>
                {r.applied ? <Badge label="Applied" tone="success" /> : null}
              </View>
              <Text style={[styles.resourceTitle, { color: c.text }]}>{r.title}</Text>
              <Text style={[styles.resourceDetail, { color: c.textSecondary }]}>{r.detail}</Text>
              <Text style={[styles.resourceSavings, { color: c.success }]}>{r.savings}</Text>
              <View style={styles.resourceActions}>
                <GradientButton
                  label="Apply"
                  icon="checkmark"
                  variant={r.applied ? "secondary" : "primary"}
                  onPress={() =>
                    setRecommendations((prev) =>
                      prev.map((x) => (x.id === r.id ? { ...x, applied: !x.applied } : x))
                    )
                  }
                  style={styles.resourceBtn}
                />
                {!r.applied ? (
                  <GradientButton
                    label="Dismiss"
                    icon="close"
                    variant="ghost"
                    onPress={() =>
                      setRecommendations((prev) => prev.filter((x) => x.id !== r.id))
                    }
                    style={styles.resourceBtn}
                  />
                ) : null}
              </View>
            </Card>
          ))}
        </View>

        {/* Theatre Schedule */}
        <SectionHeader
          title="Theatre Schedule"
          subtitle="Today · 5 procedures"
          style={styles.section}
        />
        <Card>
          {theatreSchedule.map((s, i) => (
            <View
              key={s.id}
              style={[styles.theatreRow, i < theatreSchedule.length - 1 && styles.theatreDivider]}
            >
              <View style={[styles.theatreTimeWrap, { borderColor: c.border }]}>
                <Text style={[styles.theatreTime, { color: c.text }]}>{s.time}</Text>
                <Text style={[styles.theatreName, { color: c.textMuted }]}>{s.theatre}</Text>
              </View>
              <View style={styles.theatreBody}>
                <Text style={[styles.theatreProcedure, { color: c.text }]} numberOfLines={1}>
                  {s.procedure}
                </Text>
                <Text style={[styles.theatreSurgeon, { color: c.textSecondary }]}>
                  {s.surgeon} · {s.durationMin} min
                </Text>
              </View>
              <Badge
                label={s.status}
                tone={
                  s.status === "in-progress"
                    ? "success"
                    : s.status === "delayed"
                      ? "critical"
                      : "default"
                }
              />
            </View>
          ))}
        </Card>

        {/* Staff Availability */}
        <SectionHeader
          title="Staff Availability"
          subtitle="Shift coverage by duty"
          right={<Badge label={`${onDuty.length} on duty`} tone="success" />}
          style={styles.section}
        />
        <Card>
          <View style={styles.staffDeptRow}>
            {Object.entries(staffByDept).map(([dept, count]) => (
              <StatTile key={dept} label={dept} value={`${count}`} style={styles.deptTile} />
            ))}
          </View>
          <View style={styles.staffBarList}>
            {availability.map((s) => (
              <ProgressBar
                key={s.id}
                label={s.name}
                valueLabel={`${s.role}`}
                progress={Math.max(0.15, s.available)}
                color={s.avatarColor}
                style={styles.staffBar}
              />
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  content: { padding: Spacing.three, paddingBottom: Spacing.six, gap: Spacing.three },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.two,
  },
  greetingBlock: { flex: 1 },
  greeting: { fontSize: 13, fontWeight: "500" },
  userName: { fontSize: 20, fontWeight: "700", marginTop: 2 },
  hospital: { fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    backgroundColor: `${c.success}18`,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontWeight: "700" },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: c.background,
  },

  gaugeCard: { gap: Spacing.three },
  gaugeRow: { flexDirection: "row", justifyContent: "space-between" },

  bloodHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bloodTitle: { fontSize: 14, fontWeight: "600" },
  bloodRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  bloodTile: { width: "22%", marginBottom: Spacing.one },

  section: { marginTop: Spacing.two },

  opsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two, justifyContent: "space-between" },
  opsCard: { width: "48%" },

  predictionRow: { gap: Spacing.two, paddingRight: Spacing.one },
  predictionCard: { width: 220, gap: Spacing.two },
  predictTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  predictTitle: { fontSize: 12, fontWeight: "600" },
  predictValue: { fontSize: 24, fontWeight: "700" },
  predictDelta: { fontSize: 12 },
  predictRange: { fontSize: 11, marginTop: Spacing.one },
  confidenceRow: { marginTop: Spacing.one },
  confidenceBar: { marginTop: Spacing.two },

  resourceList: { gap: Spacing.two },
  resourceCard: { gap: Spacing.two },
  resourceApplied: { opacity: 0.7 },
  resourceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resourceCatRow: { flexDirection: "row", gap: Spacing.one },
  resourceTitle: { fontSize: 16, fontWeight: "700" },
  resourceDetail: { fontSize: 13, lineHeight: 18 },
  resourceSavings: { fontSize: 12, fontWeight: "600" },
  resourceActions: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.one },
  resourceBtn: { flex: 1 },

  theatreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  theatreDivider: { borderBottomWidth: 1, borderBottomColor: c.border },
  theatreTimeWrap: {
    width: 56,
    height: 44,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  theatreTime: { fontSize: 13, fontWeight: "700" },
  theatreName: { fontSize: 10, marginTop: 1 },
  theatreBody: { flex: 1 },
  theatreProcedure: { fontSize: 14, fontWeight: "600" },
  theatreSurgeon: { fontSize: 11, marginTop: 2 },

  staffDeptRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.three, marginBottom: Spacing.three },
  deptTile: { width: 72 },
  staffBarList: { gap: Spacing.two },
  staffBar: { marginTop: Spacing.one },
});
