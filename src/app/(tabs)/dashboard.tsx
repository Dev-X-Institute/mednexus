import { useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-gifted-charts";
import { useColorScheme } from "react-native";

import { Colors, Spacing } from "@/constants/theme";
import { Skeleton } from "@/components/skeleton";
import admissionsData from "@/data/admissions.json";
import medicineData from "@/data/medicineStock.json";
import {
  predictOccupancy,
  daysUntilStockout,
  stockStatus,
  STATUS_COLORS,
  avgDailyUsage,
} from "@/utils/predictions";

const TOTAL_BEDS = 200;
const GREEN = "#15803D";
const RED = "#DC2626";
const WARNING = "#B45309";

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const dark = colorScheme === "dark";
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 64;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const dailyData = admissionsData.dailyData;
  const currentOccupancy = dailyData[dailyData.length - 1].occupancy;
  const predicted48h = useMemo(() => predictOccupancy(dailyData, 48), [dailyData]);
  const predictionDelta = predicted48h - currentOccupancy;

  const chartData = useMemo(
    () =>
      dailyData.map((d) => ({
        value: d.occupancy,
        label: d.date.slice(8),
        dataPointText: String(d.occupancy),
      })),
    [dailyData]
  );

  const icuOccupancy = dailyData[dailyData.length - 1].icuOccupancy;
  const emergencyVisits = dailyData[dailyData.length - 1].emergencyVisits;
  const avgOccupancy = Math.round(
    dailyData.reduce((s, d) => s + d.occupancy, 0) / dailyData.length
  );
  const utilizationPct = Math.round((currentOccupancy / TOTAL_BEDS) * 100);

  const medicines = useMemo(
    () =>
      medicineData.medicines
        .map((m) => ({
          ...m,
          daysLeft: daysUntilStockout(m.currentStock, m.monthlyUsageHistory),
          dailyUse: Math.round(avgDailyUsage(m.monthlyUsageHistory) * 10) / 10,
        }))
        .sort((a, b) => a.daysLeft - b.daysLeft),
    []
  );

  const occupancyColor =
    utilizationPct >= 90 ? RED : utilizationPct >= 75 ? WARNING : colors.primary;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── OCCUPANCY CARD ── */}
      {loading ? (
        <SkeletonCard dark={dark} height={248} />
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="bed-outline" size={16} color={colors.primary} />
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                Bed Occupancy
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: `${occupancyColor}18` }]}>
              <Text style={[styles.badgeText, { color: occupancyColor }]}>
                {utilizationPct}%
              </Text>
            </View>
          </View>

          <View style={styles.occupancyRow}>
            <Text style={[styles.occupancyBig, { color: colors.text }]}>
              {currentOccupancy}
            </Text>
            <Text style={[styles.occupancyDenom, { color: colors.textSecondary }]}>
              /{TOTAL_BEDS} beds
            </Text>
          </View>

          <View style={styles.chartWrap}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={120}
              spacing={chartWidth / 15}
              color={colors.primary}
              thickness={2}
              dataPointsColor={colors.primary}
              dataPointsRadius={3}
              textColor={colors.textSecondary}
              textFontSize={9}
              hideAxesAndRules
              xAxisLabelTextStyle={styles.xLabel}
              curved
              isAnimated
              animationDuration={600}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                48h forecast
              </Text>
              <View style={styles.forecastRow}>
                <Text style={[styles.statValue, { color: colors.text }]}>{predicted48h}</Text>
                <Ionicons
                  name={
                    predictionDelta > 0
                      ? "trending-up"
                      : predictionDelta < 0
                        ? "trending-down"
                        : "remove-outline"
                  }
                  size={14}
                  color={
                    predictionDelta > 0 ? RED : predictionDelta < 0 ? GREEN : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.deltaText,
                    {
                      color:
                        predictionDelta > 0 ? RED : predictionDelta < 0 ? GREEN : colors.textSecondary,
                    },
                  ]}
                >
                  {predictionDelta > 0 ? "+" : ""}
                  {predictionDelta}
                </Text>
              </View>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statBlock}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ICU</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{icuOccupancy}</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statBlock}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ER visits</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{emergencyVisits}</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            <View style={styles.statBlock}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>14d avg</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{avgOccupancy}</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── PHARMACY STOCK ── */}
      <View style={styles.sectionHeader}>
        <Ionicons name="medical-outline" size={16} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pharmacy Stock</Text>
        <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
          {medicines.length} items
        </Text>
      </View>

      {loading ? (
        <View style={styles.medicineScroll}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width={156} height={128} radius={10} dark={dark} />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.medicineScroll}
        >
          {medicines.map((med) => {
            const status = stockStatus(med.daysLeft);
            const sColor = STATUS_COLORS[status];
            const stockPct = Math.min(100, Math.round((med.currentStock / med.reorderPoint) * 50));

            return (
              <View
                key={med.id}
                style={[
                  styles.medCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.medHeader}>
                  <View style={[styles.statusDot, { backgroundColor: sColor.dot }]} />
                  <Text style={[styles.medCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                    {med.category}
                  </Text>
                </View>

                <Text style={[styles.medName, { color: colors.text }]} numberOfLines={2}>
                  {med.name}
                </Text>

                <View style={styles.stockRow}>
                  <Text style={[styles.stockNumber, { color: colors.text }]}>
                    {med.currentStock}
                  </Text>
                  <Text style={[styles.stockUnit, { color: colors.textSecondary }]}>
                    {med.unit}
                  </Text>
                </View>

                <View
                  style={[styles.progressTrack, { backgroundColor: colors.backgroundElement }]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${stockPct}%`, backgroundColor: sColor.dot },
                    ]}
                  />
                </View>

                <View style={styles.medFooter}>
                  <View style={[styles.daysLeftBadge, { backgroundColor: sColor.bg }]}>
                    <Text style={[styles.daysLeftText, { color: sColor.text }]}>
                      {med.daysLeft < 999 ? `${med.daysLeft}d left` : "N/A"}
                    </Text>
                  </View>
                  <Text style={[styles.dailyUse, { color: colors.textSecondary }]}>
                    ~{med.dailyUse}/d
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── QUICK STATS ── */}
      {!loading && (
        <View style={styles.quickStats}>
          {[
            {
              icon: "alert-circle-outline" as const,
              label: "Low stock",
              value: String(medicines.filter((m) => m.daysLeft < 14).length),
              color: RED,
            },
            {
              icon: "trending-up-outline" as const,
              label: "Admits today",
              value: String(dailyData[dailyData.length - 1].admissions),
              color: colors.primary,
            },
            {
              icon: "log-out-outline" as const,
              label: "Discharges",
              value: String(dailyData[dailyData.length - 1].discharges),
              color: colors.textSecondary,
            },
          ].map((item, i) => (
            <View key={i} style={[styles.quickStatCard, { backgroundColor: colors.card }]}>
              <Ionicons name={item.icon} size={18} color={item.color} />
              <Text style={[styles.quickStatValue, { color: colors.text }]}>{item.value}</Text>
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function SkeletonCard({ dark, height }: { dark: boolean; height: number }) {
  return (
    <View style={[styles.card, { height }]}>
      <View style={styles.skRow}>
        <Skeleton width={120} height={14} dark={dark} />
        <Skeleton width={40} height={14} dark={dark} />
      </View>
      <Skeleton width={160} height={32} dark={dark} style={{ marginTop: Spacing.two }} />
      <Skeleton width="100%" height={96} dark={dark} style={{ marginTop: Spacing.three }} />
      <View style={styles.skRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.skStat}>
            <Skeleton width="80%" height={10} dark={dark} />
            <Skeleton width="60%" height={18} dark={dark} style={{ marginTop: Spacing.one }} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },

  card: {
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.two,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  cardLabel: { fontSize: 13, fontWeight: "500" },
  badge: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 6 },
  badgeText: { fontSize: 13, fontWeight: "700" },

  occupancyRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.two,
  },
  occupancyBig: { fontSize: 36, fontWeight: "700", letterSpacing: -1 },
  occupancyDenom: { fontSize: 14, fontWeight: "500", marginLeft: Spacing.one },

  chartWrap: { marginBottom: Spacing.three, marginLeft: -Spacing.two },
  xLabel: { fontSize: 9 },

  statsRow: { flexDirection: "row", alignItems: "center" },
  statBlock: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: 11, fontWeight: "500", marginBottom: Spacing.one },
  statValue: { fontSize: 18, fontWeight: "700" },
  statDivider: { width: 1, height: 32, marginHorizontal: Spacing.one },
  forecastRow: { flexDirection: "row", alignItems: "center", gap: Spacing.one },
  deltaText: { fontSize: 12, fontWeight: "600" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  sectionCount: { fontSize: 12, fontWeight: "500" },

  medicineScroll: { gap: Spacing.two, paddingBottom: Spacing.one },
  medCard: {
    width: 156,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: Spacing.two,
  },
  medHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.one },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  medCategory: { fontSize: 10, fontWeight: "500", flex: 1 },
  medName: { fontSize: 13, fontWeight: "600", lineHeight: 17, minHeight: 34 },

  stockRow: { flexDirection: "row", alignItems: "baseline", gap: Spacing.one },
  stockNumber: { fontSize: 20, fontWeight: "700" },
  stockUnit: { fontSize: 11, fontWeight: "400" },

  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },

  medFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.one,
  },
  daysLeftBadge: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: 4 },
  daysLeftText: { fontSize: 10, fontWeight: "700" },
  dailyUse: { fontSize: 10, fontWeight: "400" },

  quickStats: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.three },
  quickStatCard: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    gap: Spacing.one,
  },
  quickStatValue: { fontSize: 20, fontWeight: "700" },
  quickStatLabel: { fontSize: 11, fontWeight: "500" },

  skRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skStat: { flex: 1, alignItems: "center" },
});
