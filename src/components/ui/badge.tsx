import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Radii, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type BadgeTone = "info" | "success" | "warning" | "critical" | "default";

interface BadgeProps {
  label: string | number;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}

const ALPHA_SUFFIX = "2E";

export function Badge({ label, tone = "default", style }: BadgeProps) {
  const colors = useTheme();

  const toneColor =
    tone === "default"
      ? colors.textSecondary
      : tone === "info"
      ? colors.info
      : tone === "success"
      ? colors.success
      : tone === "warning"
      ? colors.warning
      : colors.critical;

  const background =
    tone === "default" ? `${colors.border}${ALPHA_SUFFIX}` : `${toneColor}${ALPHA_SUFFIX}`;
  const textColor = tone === "default" ? colors.textSecondary : toneColor;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: background,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
  },
});
