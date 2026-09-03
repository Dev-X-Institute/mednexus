import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface ProgressBarProps {
  label: string;
  valueLabel?: string;
  progress: number;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  label,
  valueLabel,
  progress,
  color,
  height = 8,
  style,
}: ProgressBarProps) {
  const colors = useTheme();

  const clamped = Math.max(0, Math.min(1, progress));
  const fillColor = color ?? colors.primary;

  return (
    <View style={style}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        {valueLabel ? (
          <Text style={[styles.valueLabel, { color: colors.text }]}>{valueLabel}</Text>
        ) : null}
      </View>
      <View
        style={[
          styles.track,
          {
            height,
            borderRadius: height / 2,
            borderColor: colors.border,
            borderWidth: 1,
            backgroundColor: colors.cardElevated,
            marginTop: Spacing.one,
          },
        ]}
      >
        <View
          style={{
            width: `${clamped * 100}%`,
            height,
            borderRadius: height / 2,
            backgroundColor: fillColor,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 12,
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  track: {
    overflow: "hidden",
  },
});
