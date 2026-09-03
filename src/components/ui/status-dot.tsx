import { View, type StyleProp, type ViewStyle } from "react-native";

interface StatusDotProps {
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function StatusDot({ color, size = 8, style }: StatusDotProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}