import { getHeaderTitle } from "@react-navigation/elements";
import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../core/theme/theme";
import { AccountHeaderMenu } from "../shared/components/AccountHeaderMenu";

export function AppStackHeader({ navigation, options, route }: NativeStackHeaderProps) {
  const title = getHeaderTitle(options, route.name);
  const canGoBack = navigation.canGoBack();
  const showBack = canGoBack && options.headerBackVisible !== false;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.row}>
        <View style={styles.side}>
          {showBack ? (
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={styles.backBtn}
            >
              <Text style={styles.backChevron}>‹</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.side}>
          <AccountHeaderMenu />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.topNav,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: spacing.xs,
  },
  side: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  backChevron: {
    fontSize: 34,
    fontWeight: "300",
    color: colors.primary,
    marginTop: -4,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
});
