import { StyleSheet, Text, View, type StyleProp, type ViewStyle, Pressable } from "react-native";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { StatusDot } from "./status-dot";
import { Sparkline } from "./sparkline";

type GlyphName = keyof typeof Ionicons.glyphMap;
type DeltaTone = "up" | "down" | "neutral";
type StatusTone = "success" | "warning" | "critical";

interface MetricCardProps {
  icon: GlyphName;
  label: string;
  value: string;
  delta?: string;
  deltaTone?: DeltaTone;
  spark?: number[];
  statusTone?: StatusTone;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  onPress?: () => void;
}

export function MetricCard({
  icon,
  label,
  value,
  delta,
  deltaTone = "neutral",
  spark,
  statusTone = "success",
  style,
  accessibilityLabel,
  onPress,
}: MetricCardProps) {
  const { colors } = useTheme();

  const deltaColor =
    deltaTone === "up"
      ? colors.success
      : deltaTone === "down"
      ? colors.critical
      : colors.textSecondary;

  const statusColor =
    statusTone === "success"
      ? colors.success
      : statusTone === "warning"
      ? colors.warning
      : colors.critical;

  const a11yLabel = accessibilityLabel ?? `${label}, ${value}${delta ? `, ${delta}` : ""}`;

  const Component = onPress ? Pressable : View;
  const pressProps = onPress ? { onPress, activeOpacity: 0.8 } : {};

  return (
    <Component
      {...pressProps}
      style={[styles.card, style]}
      accessible={true}
      accessibilityLabel={a11yLabel}
      accessibilityRole={onPress ? "button" : "text"}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconLabel}>
          <StatusDot color={statusColor} />
          <Ionicons name={icon} size={14} color={colors.accent} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
      </View>

      <View style={styles.lowerRow}>
        <View style={styles.valueColumn}>
          <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
            {value}
          </Text>
          {delta ? (
            <Text style={[styles.delta, { color: deltaColor }]}>{delta}</Text>
          ) : null}
        </View>
        {spark && spark.length > 0 ? <Sparkline data={spark} height={36} width={72} /> : null}
      </View>
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  label: {
    fontSize: 12,
  },
  lowerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: Spacing.three,
  },
  valueColumn: {
    flex: 1,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  delta: {
    fontSize: 12,
    marginTop: Spacing.one,
  },
});