import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useTheme } from "@/hooks/use-theme";

type GaugeTone = "primary" | "success" | "warning" | "critical";

interface RingGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: GaugeTone;
  centerLabel?: string;
  centerCaption?: string;
  style?: StyleProp<ViewStyle>;
}

export function RingGauge({
  value,
  size = 120,
  strokeWidth = 10,
  tone = "primary",
  centerLabel,
  centerCaption,
  style,
}: RingGaugeProps) {
  const colors = useTheme();

  const clamp = Math.max(0, Math.min(100, value));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (circumference * clamp) / 100;

  const strokeColor =
    tone === "primary"
      ? colors.primary
      : tone === "success"
      ? colors.success
      : tone === "warning"
      ? colors.warning
      : colors.critical;

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
          />
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {centerLabel ? (
          <Text style={[styles.label, { color: colors.text }]}>{centerLabel}</Text>
        ) : null}
        {centerCaption ? (
          <Text style={[styles.caption, { color: colors.textSecondary }]}>{centerCaption}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 24,
    fontWeight: "700",
  },
  caption: {
    fontSize: 11,
    marginTop: 2,
  },
});
