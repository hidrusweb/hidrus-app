import { Controller } from "react-hook-form";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, spacing } from "../../core/theme/theme";

type Props = {
  control: any;
  name: string;
  label: string;
  secureTextEntry?: boolean;
};

export function FormInput({ control, name, label, secureTextEntry }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = !!secureTextEntry;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isPasswordField && styles.inputWithAction, error && styles.errorBorder]}
              value={String(value ?? "")}
              onChangeText={onChange}
              secureTextEntry={isPasswordField ? !showPassword : false}
              autoCapitalize="none"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            {isPasswordField && isFocused ? (
              <Pressable style={styles.action} onPress={() => setShowPassword((prev) => !prev)}>
                <Text style={styles.actionText}>{showPassword ? "Ocultar" : "Mostrar"}</Text>
              </Pressable>
            ) : null}
          </View>
          {error?.message ? <Text style={styles.error}>{error.message}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { color: colors.mutedText, marginBottom: spacing.xs, fontWeight: "600" },
  inputContainer: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputWithAction: {
    paddingRight: 90,
  },
  action: {
    position: "absolute",
    right: spacing.md,
    paddingVertical: 2,
  },
  actionText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  error: { color: colors.danger, marginTop: 4 },
  errorBorder: { borderColor: colors.danger },
});
