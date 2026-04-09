import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, spacing } from "../../core/theme/theme";

type Props = {
  label: string;
  loading?: boolean;
  onPress: () => void;
};

export function PrimaryButton({ label, loading, onPress }: Props) {
  return (
    <Pressable style={styles.button} onPress={onPress} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  label: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
