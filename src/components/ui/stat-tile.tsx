import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/hooks/use-theme";

interface StatTileProps {
  label: string;
  value: string;
  tone?: string;
  style?: StyleProp<ViewStyle>;
}

export function StatTile({ label, value, tone, style }: StatTileProps) {
  const colors = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.value, { color: tone ?? colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
});
