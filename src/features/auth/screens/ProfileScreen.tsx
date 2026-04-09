import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../../../core/theme/theme";
import { useAuthStore } from "../store/useAuthStore";

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Nome</Text>
        <Text style={styles.value}>{user?.nome || "—"}</Text>

        <Text style={styles.label}>CPF/CNPJ</Text>
        <Text style={styles.value}>{user?.cpf || "—"}</Text>

        <Text style={styles.label}>E-mail</Text>
        <Text style={styles.value}>{user?.email || "—"}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 17,
    color: colors.text,
    marginBottom: spacing.lg,
  },
});
