import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Radii, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type GlyphName = keyof typeof Ionicons.glyphMap;
type ButtonVariant = "primary" | "secondary" | "ghost";

interface GradientButtonProps {
  label: string;
  icon?: GlyphName;
  variant?: ButtonVariant;
  onPress?: () => void;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function GradientButton({
  label,
  icon,
  variant = "primary",
  onPress,
  loading = false,
  style,
  fullWidth = false,
}: GradientButtonProps) {
  const colors = useTheme();

  const content = loading ? (
    <ActivityIndicator
      color={variant === "primary" ? "#FFFFFF" : colors.accent}
      size="small"
    />
  ) : (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={variant === "primary" ? "#FFFFFF" : colors.text}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          {
            color:
              variant === "primary" ? "#FFFFFF" : variant === "ghost" ? colors.accent : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </>
  );

  const baseStyle = [styles.base, fullWidth && styles.fullWidth, style];

  if (variant === "primary") {
    return (
      <Pressable onPress={onPress} disabled={loading}>
        <View style={[baseStyle, { backgroundColor: colors.primary }]}>
          {content}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={loading}>
      <View
        style={[
          baseStyle,
          variant === "secondary" && {
            backgroundColor: colors.cardElevated,
            borderColor: colors.border,
            borderWidth: 1,
          },
        ]}
      >
        {content}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.four,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
  icon: {
    marginRight: Spacing.two,
  },
});
