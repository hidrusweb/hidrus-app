import { zodResolver } from "@hookform/resolvers/zod";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { colors, spacing } from "../../../core/theme/theme";
import { FormInput } from "../../../shared/components/FormInput";
import { PrimaryButton } from "../../../shared/components/PrimaryButton";
import { changePassword } from "../services/authService";
import type { AuthStackParamList } from "../../../navigation/types";

const schema = z.object({
  senha: z.string().min(6, "Minimo de 6 caracteres."),
});
type FormData = z.infer<typeof schema>;

export function RecoverPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, "RecoverPassword">>();
  const { control, handleSubmit, formState } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { senha: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword(route.params.cpfCnpj, values.senha);
      Alert.alert("Sucesso", "Senha atualizada com sucesso.");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Erro", (error as Error).message);
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova senha</Text>
      <FormInput control={control} name="senha" label="Senha" secureTextEntry />
      <PrimaryButton label="Atualizar senha" loading={formState.isSubmitting} onPress={onSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: spacing.xl, color: colors.text },
});
