import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Radii, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  leading?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected, onPress, leading, style }: ChipProps) {
  const colors = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.chip, style]}>
      {selected ? (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chip}
        >
          <View style={styles.pill}>
            {leading}
            <Text style={[styles.label, { color: "#FFFFFF" }]}>{label}</Text>
          </View>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.pill,
            {
              borderColor: colors.border,
              borderWidth: 1,
              backgroundColor: colors.cardElevated,
            },
          ]}
        >
          {leading}
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radii.pill,
    overflow: "hidden",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
