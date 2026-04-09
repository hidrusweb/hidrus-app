import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../core/theme/theme";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hidrus Contas</Text>
      <ActivityIndicator color={colors.secondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 16, color: colors.text },
});
