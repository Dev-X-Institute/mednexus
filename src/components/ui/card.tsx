import { View, type StyleProp, type ViewStyle } from "react-native";
import { Radii, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type CardVariant = "default" | "elevated" | "glass";

interface CardProps {
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Card({ variant = "default", style, children }: CardProps) {
  const colors = useTheme();

  const backgrounds: Record<CardVariant, string> = {
    default: colors.card,
    elevated: colors.cardElevated,
    glass: colors.glass,
  };

  return (
    <View
      style={[
        {
          backgroundColor: backgrounds[variant],
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: Radii.lg,
          padding: Spacing.three,
          shadowColor: "#0F172A",
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
