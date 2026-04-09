import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, spacing } from "../../core/theme/theme";
import { useAuthStore } from "../../features/auth/store/useAuthStore";
import type { AppStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function AccountHeaderMenu() {
  const navigation = useNavigation<Nav>();
  const logout = useAuthStore((s) => s.logout);
  const headerHeight = useHeaderHeight();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  const onPerfil = () => {
    close();
    navigation.navigate("Profile");
  };

  const onSair = async () => {
    close();
    await logout();
  };

  const menuTop = headerHeight + spacing.xs;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu"
        android_ripple={null}
        style={({ pressed }) => [styles.trigger, pressed && Platform.OS === "ios" && styles.triggerPressed]}
      >
        <View style={styles.triggerDots}>
          <View style={styles.triggerDot} />
          <View style={styles.triggerDot} />
          <View style={styles.triggerDot} />
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View style={[styles.menu, { top: menuTop }]}>
            <Pressable
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={onPerfil}
            >
              <Text style={styles.itemText}>Perfil</Text>
            </Pressable>
            <View style={styles.separator} />
            <Pressable
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={onSair}
            >
              <Text style={[styles.itemText, styles.dangerText]}>Sair</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  triggerPressed: {
    opacity: 0.55,
  },
  triggerDots: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  triggerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  modalRoot: {
    flex: 1,
  },
  menu: {
    position: "absolute",
    right: spacing.md,
    minWidth: 180,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  item: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  itemPressed: {
    backgroundColor: colors.background,
  },
  itemText: {
    fontSize: 16,
    color: colors.text,
  },
  dangerText: {
    color: colors.danger,
    fontWeight: "600",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
});
