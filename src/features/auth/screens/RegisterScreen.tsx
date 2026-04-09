import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { colors, spacing } from "../../../core/theme/theme";
import { FormInput } from "../../../shared/components/FormInput";
import { PrimaryButton } from "../../../shared/components/PrimaryButton";
import { register } from "../services/authService";
import type { AuthStackParamList } from "../../../navigation/types";

const schema = z.object({
  cpf: z.string().min(11, "CPF/CNPJ invalido."),
  senha: z.string().min(6, "Minimo de 6 caracteres."),
});
type FormData = z.infer<typeof schema>;

export function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { control, handleSubmit, formState } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cpf: "", senha: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await register(values.cpf, values.senha);
      Alert.alert("Sucesso", "Conta criada com sucesso.");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Erro", (error as Error).message);
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar</Text>
      <FormInput control={control} name="cpf" label="CPF/CNPJ" />
      <FormInput control={control} name="senha" label="Senha" secureTextEntry />
      <PrimaryButton label="Registrar" loading={formState.isSubmitting} onPress={onSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: spacing.xl, color: colors.text },
});
