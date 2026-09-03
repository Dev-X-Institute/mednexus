import { useColorScheme } from "react-native";
import { Colors } from "@/constants/theme";
import { useColorScheme as useRNColorScheme } from "@/hooks/use-color-scheme";

export function useTheme() {
  const scheme = useRNColorScheme();
  const theme = scheme === "unspecified" ? "light" : scheme;

  return Colors[theme];
}
