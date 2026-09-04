import { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { Card, ProgressBar, SectionHeader } from "@/components/ui";
import admissionsData from "@/data/admissions.json";
import medicineStock from "@/data/medicineStock.json";

const c = Colors.light;
type Tab = "Flow" | "Quality" | "Resources";
const TABS: Tab[] = ["Flow", "Quality", "Resources"];

export default function AnalyticsScreen() {
  const [tab, setTab] = useState<Tab>("Flow");
  const total = useMemo(() => admissionsData.dailyData.reduce((sum, day) => sum + day.admissions, 0), []);
  return <SafeAreaView style={styles.safe} edges={["top"]}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Text style={styles.title}>Analytics</Text><Text style={styles.subtitle}>Operational trends · Korle Bu demo workspace</Text></View>
    <View style={styles.tabs}>{TABS.map((item) => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text></Pressable>)}</View>
    {tab === "Flow" ? <Flow total={total} /> : tab === "Quality" ? <Quality /> : <Resources />}
  </ScrollView></SafeAreaView>;
}

function Flow({ total }: { total: number }) {
  const admissions = admissionsData.dailyData.slice(-7).map((item) => item.admissions);
  return <View style={styles.stack}>
    <ChartCard title="Patient flow — admissions" subtitle="Admissions over the last 7 days" values={admissions} color={c.primary} labels={["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Today"]} />
    <ChartCard title="ER waiting time" subtitle="Average minutes · target ≤ 45" values={[28, 31, 40, 54, 49, 57, 43]} color={c.warning} labels={["08", "10", "12", "14", "16", "18", "20"]} target={45} />
    <Card style={styles.summary}><SectionHeader title="Today’s throughput" subtitle="Live operational summary" /><Row label="Admissions today" value={`${admissions.at(-1) ?? 0}`} color={c.primary} /><Row label="Discharges today" value={`${admissionsData.dailyData.at(-1)?.discharges ?? 0}`} color={c.success} /><Row label="Ambulance arrivals" value="18" color={c.text} /><Row label="Avg. admission decision" value="38 min" color={c.warning} /></Card>
    <Text style={styles.note}>{total} admissions recorded in this simulated 14-day period.</Text>
  </View>;
}

function Quality() { return <View style={styles.stack}>
  <ChartCard title="Length of stay" subtitle="Average days by unit" values={[6.8, 4.1, 5.2, 4.6, 3.4, 2.8]} color={c.primary} labels={["ICU", "Surg.", "Med.", "Cardio", "Peds", "Obs."]} />
  <ChartCard title="30-day readmission rate" subtitle="Percent · trending down" values={[9.2, 8.7, 9.0, 7.8, 7.2, 6.9]} color={c.accent} labels={["Apr", "May", "Jun", "Jul", "Aug", "Sep"]} />
  <ChartCard title="Mortality trend" subtitle="Percent · trailing 6 months" values={[3.4, 3.0, 3.3, 2.7, 2.5, 2.3]} color={c.critical} labels={["Apr", "May", "Jun", "Jul", "Aug", "Sep"]} />
</View>; }

function Resources() { const medicines = medicineStock.medicines.slice().sort((a, b) => b.monthlyUsageHistory[2] - a.monthlyUsageHistory[2]).slice(0, 5); return <View style={styles.stack}>
  <Card style={styles.resourceCard}><SectionHeader title="Medication consumption" subtitle="Typical monthly dispensing volume" />{medicines.map((medicine) => <ProgressBar key={medicine.id} label={medicine.name} valueLabel={`${medicine.monthlyUsageHistory[2]}`} progress={Math.min(1, medicine.monthlyUsageHistory[2] / 850)} color={c.info} style={styles.bar} />)}</Card>
  <Card style={styles.resourceCard}><SectionHeader title="Team workload" subtitle="Capacity utilization by service" /><ProgressBar label="Emergency" valueLabel="82%" progress={0.82} color={c.primary} style={styles.bar} /><ProgressBar label="Intensive care" valueLabel="76%" progress={0.76} color={c.primary} style={styles.bar} /><ProgressBar label="Surgery" valueLabel="65%" progress={0.65} color={c.accent} style={styles.bar} /><ProgressBar label="Medicine" valueLabel="58%" progress={0.58} color={c.accent} style={styles.bar} /></Card>
</View>; }

function ChartCard({ title, subtitle, values, labels, color, target }: { title: string; subtitle: string; values: number[]; labels: string[]; color: string; target?: number }) { const max = Math.max(...values, target ?? 0) * 1.15; return <Card style={styles.chart}><SectionHeader title={title} subtitle={subtitle} /><View style={styles.plot}>{target ? <View style={[styles.target, { bottom: `${(target / max) * 100}%` }]}><Text style={[styles.targetText, { color: c.success }]}>target</Text></View> : null}<View style={styles.bars}>{values.map((value, index) => <View style={styles.column} key={`${labels[index]}-${value}`}><View style={styles.barWrap}><View style={[styles.chartBar, { height: `${Math.max(8, (value / max) * 100)}%`, backgroundColor: color }]} /></View><Text style={styles.axisLabel}>{labels[index]}</Text></View>)}</View></View></Card>; }
function Row({ label, value, color }: { label: string; value: string; color: string }) { return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={[styles.rowValue, { color }]}>{value}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background }, content: { padding: Spacing.three, paddingBottom: 125, gap: Spacing.three }, header: { marginTop: Spacing.one }, title: { color: c.text, fontSize: 24, fontWeight: "800" }, subtitle: { color: c.textSecondary, fontSize: 13, marginTop: 3 }, tabs: { flexDirection: "row", padding: 4, borderRadius: Radii.pill, backgroundColor: c.backgroundDim }, tab: { flex: 1, alignItems: "center", borderRadius: Radii.pill, paddingVertical: 10 }, tabActive: { backgroundColor: c.card, shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }, tabText: { color: c.textSecondary, fontWeight: "700" }, tabTextActive: { color: c.primary }, stack: { gap: Spacing.three }, chart: { gap: Spacing.three }, plot: { height: 176, position: "relative", borderBottomWidth: 1, borderColor: c.border }, bars: { flexDirection: "row", alignItems: "flex-end", height: "100%", gap: Spacing.two }, column: { flex: 1, alignItems: "center", height: "100%" }, barWrap: { flex: 1, width: "100%", justifyContent: "flex-end", paddingHorizontal: 3 }, chartBar: { borderTopLeftRadius: 7, borderTopRightRadius: 7, opacity: 0.86 }, axisLabel: { color: c.textMuted, fontSize: 10, marginTop: 7 }, target: { position: "absolute", left: 0, right: 0, borderTopWidth: 1, borderColor: c.success, borderStyle: "dashed", zIndex: 2 }, targetText: { alignSelf: "flex-end", backgroundColor: c.card, fontSize: 10, fontWeight: "700", paddingHorizontal: 4, marginTop: -8 }, summary: { gap: Spacing.two }, row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.one }, rowLabel: { color: c.textSecondary, fontSize: 15 }, rowValue: { fontSize: 16, fontWeight: "800" }, note: { color: c.textMuted, textAlign: "center", fontSize: 11 }, resourceCard: { gap: Spacing.two }, bar: { marginTop: Spacing.two },
});
