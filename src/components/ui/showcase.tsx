import { ScrollView, StyleSheet, View } from "react-native";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Badge } from "./badge";
import { Chip } from "./chip";
import { GradientButton } from "./gradient-button";
import { MetricCard } from "./metric-card";
import { ProgressBar } from "./progress-bar";
import { RingGauge } from "./ring-gauge";
import { SectionHeader } from "./section-header";
import { Sparkline } from "./sparkline";
import { StatTile } from "./stat-tile";
import { StatusDot } from "./status-dot";
import { Card } from "./card";

export function ShowcaseGallery() {
  const colors = useTheme();

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Card>
          <SectionHeader title="Primitives" subtitle="Chip, Badge, StatusDot, Buttons" />

          <View style={styles.section}>
            <SectionHeader title="Chip" />
            <View style={styles.row}>
              <Chip label="All" selected onPress={() => {}} />
              <Chip label="Emerging" selected={false} onPress={() => {}} />
              <Chip label="Tracked" selected={false} onPress={() => {}} />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Badge" />
            <View style={styles.row}>
              <Badge label="12 new" tone="success" />
              <Badge label="Alert" tone="warning" />
              <Badge label="Critical" tone="critical" />
              <Badge label="10%" tone="info" />
              <Badge label="zzz" tone="default" />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="StatusDot" />
            <View style={styles.row}>
              <StatusDot color={colors.success} />
              <StatusDot color={colors.warning} />
              <StatusDot color={colors.critical} />
              <StatusDot color={colors.primary} />
            </View>
          </View>
        </Card>

        <Card>
          <SectionHeader title="Buttons" />
          <GradientButton label="Primary" fullWidth style={styles.button} />
          <GradientButton label="Secondary" variant="secondary" fullWidth style={styles.button} />
          <GradientButton label="Ghost" variant="ghost" fullWidth style={styles.button} />
          <GradientButton label="Loading" loading fullWidth style={styles.button} />
        </Card>

        <Card>
          <SectionHeader title="Gauges & Sparkline" />
          <View style={styles.section}>
            <View style={styles.row}>
              <RingGauge value={87} tone="primary" centerLabel="87%" centerCaption="Beds" />
              <RingGauge value={42} tone="success" centerLabel="42%" centerCaption="RAM" />
              <RingGauge value={19} tone="critical" centerLabel="19" centerCaption="Queue" />
            </View>
          </View>
          <View style={styles.section}>
            <View style={styles.rowWrap}>
              <Sparkline data={[5, 9, 7, 12, 8, 14, 11, 16]} color={colors.primary} />
              <Sparkline
                data={[10, 8, 6, 9, 5, 4, 6, 3]}
                color={colors.success}
                height={40}
                width={100}
              />
              <Sparkline data={[3, 7, 4, 9, 12, 10, 8, 11]} color={colors.warning} />
            </View>
          </View>
        </Card>

        <Card>
          <SectionHeader title="Stats" />
          <View style={styles.rowWrap}>
            <StatTile label="Patients today" value="1,284" />
            <StatTile label="Avg wait" value="12m" tone={colors.success} />
            <StatTile label="Over capacity" value="3" tone={colors.critical} />
          </View>
        </Card>

        <Card>
          <SectionHeader title="Progress" />
          <ProgressBar
            label="ICU availability"
            valueLabel="72%"
            progress={0.72}
            color={colors.primary}
            style={styles.progress}
          />
          <ProgressBar
            label="Bed occupancy"
            valueLabel="58%"
            progress={0.58}
            color={colors.success}
            style={styles.progress}
          />
          <ProgressBar
            label="Queue length"
            valueLabel="18%"
            progress={0.18}
            color={colors.critical}
            style={styles.progress}
          />
        </Card>

        <Card>
          <SectionHeader title="Metric Card" />
          <View style={styles.metricGrid}>
            <MetricCard
              icon="bed"
              label="Occupied beds"
              value="214"
              delta="+6 this hour"
              deltaTone="up"
              spark={[10, 14, 12, 16, 15, 19, 18, 21]}
              statusTone="success"
            />
            <MetricCard
              icon="time"
              label="Avg wait"
              value="12m"
              delta="-3 from peak"
              deltaTone="down"
              spark={[20, 16, 18, 14, 12, 10, 9, 8]}
              statusTone="warning"
            />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  section: {
    marginTop: Spacing.three,
  },
  button: {
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  progress: {
    marginBottom: Spacing.three,
  },
  metricGrid: {
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
});

export default ShowcaseGallery;
