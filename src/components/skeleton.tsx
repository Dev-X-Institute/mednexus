import { useEffect } from "react";
import type { ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
  dark?: boolean;
};

/**
 * A pulsing placeholder block used while data is loading.
 * Reusable across dashboard cards and search results.
 */
export function Skeleton({
  width = "100%",
  height = 14,
  radius = 6,
  style,
  dark = false,
}: SkeletonProps) {
  const opacity = useSharedValue(dark ? 0.4 : 0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(dark ? 0.15 : 0.1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity, dark]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: dark ? "#334155" : "#E2E8F0",
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
