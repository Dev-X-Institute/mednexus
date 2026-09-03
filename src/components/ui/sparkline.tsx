import { View, type StyleProp, type ViewStyle } from "react-native";
import { LineChart, type lineDataItem } from "react-native-gifted-charts";
import { useTheme } from "@/hooks/use-theme";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  style?: StyleProp<ViewStyle>;
}

export function Sparkline({
  data,
  color,
  height = 40,
  width = 100,
  style,
}: SparklineProps) {
  const colors = useTheme();

  if (data.length === 0) {
    return null;
  }

  const lineData: lineDataItem[] = data.map((value) => ({ value }));
  const lineColor = color ?? colors.primary;

  return (
    <View style={[{ width, height }, style]}>
      <LineChart
        data={lineData}
        height={height}
        width={width}
        color={lineColor}
        thickness={2}
        curved
        hideAxesAndRules
        hideDataPoints
        hideYAxisText
        showYAxisIndices={false}
        yAxisThickness={0}
        xAxisThickness={0}
        initialSpacing={0}
        endSpacing={0}
        adjustToWidth
        disableScroll
      />
    </View>
  );
}
