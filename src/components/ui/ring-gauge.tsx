import { useEffect } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/context/accessibility";

type GaugeTone = "primary" | "success" | "warning" | "critical";

interface RingGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: GaugeTone;
  centerLabel?: string;
  centerCaption?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  animate?: boolean;
  delay?: number;
}

const ACircle = Animated.createAnimatedComponent(Circle);
const AG = Animated.createAnimatedComponent(G);

export function RingGauge({
  value,
  size = 120,
  strokeWidth = 10,
  tone = "primary",
  centerLabel,
  centerCaption,
  accessibilityLabel,
  style,
  animate = true,
  delay = 0,
}: RingGaugeProps) {
  const { colors } = useTheme();
  const { reduceMotion } = useAccessibility();

  const clamp = Math.max(0, Math.min(100, value));
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);

  useEffect(() => {
    const target = clamp / 100;
    if (animate && !reduceMotion) {
      progress.value = withDelay(delay, withTiming(target, { duration: 1000, easing: Easing.out(Easing.ease) }));
    } else {
      progress.value = target;
    }
  }, [clamp, animate, delay, reduceMotion, progress]);

  const strokeColor =
    tone === "primary"
      ? colors.primary
      : tone === "success"
      ? colors.success
      : tone === "warning"
      ? colors.warning
      : colors.critical;

  const animatedProps = useAnimatedProps(() => {
    const dash = circumference * progress.value;
    return {
      strokeDasharray: `${dash} ${circumference - dash}`,
    };
  });

  const a11yLabel = accessibilityLabel ?? `${tone} gauge, ${clamp} percent`;

  return (
    <View
      style={[styles.wrap, { width: size, height: size }, style]}
      accessible
      accessibilityLabel={a11yLabel}
      accessibilityRole="image"
    >
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AG rotation={-90} origin={`${center}, ${center}`}>
          <ACircle
            cx={center}
            cy={center}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            animatedProps={animatedProps}
          />
        </AG>
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
    fontVariant: ["tabular-nums"],
  },
  caption: {
    fontSize: 11,
    marginTop: 2,
  },
});