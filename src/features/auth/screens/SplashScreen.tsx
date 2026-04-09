import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { colors } from "../../../core/theme/theme";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../../../assets/logo-hydrus.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator color={colors.secondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  logo: { width: 260, height: 180, marginBottom: 18 },
});
