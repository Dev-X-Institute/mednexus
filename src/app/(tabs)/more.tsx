import { Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing } from "@/constants/theme";
import { Card, SectionHeader } from "@/components/ui";

export default function MoreScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="More" subtitle="Settings and departments" />
        <Card>
          <Text style={styles.todo}>More screen in progress</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.three, gap: Spacing.three },
  todo: { fontSize: 14, color: Colors.light.textSecondary },
});
