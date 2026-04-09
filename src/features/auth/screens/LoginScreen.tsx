import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useForm } from "react-hook-form";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { colors, spacing } from "../../../core/theme/theme";
import { FormInput } from "../../../shared/components/FormInput";
import { PrimaryButton } from "../../../shared/components/PrimaryButton";
import { useAuthStore } from "../store/useAuthStore";
import type { AuthStackParamList } from "../../../navigation/types";

const schema = z.object({
  cpf: z.string().min(11, "Informe o CPF/CNPJ."),
  senha: z.string().min(1, "Informe a senha."),
  lembrar: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { control, handleSubmit, setValue, watch } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: { cpf: "", senha: "", lembrar: false },
  });
  const { login, loading } = useAuthStore();
  const lembrar = watch("lembrar");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.cpf, values.senha, values.lembrar);
    } catch (error) {
      Alert.alert("Erro", (error as Error).message);
    }
  });

  return (
    <View style={styles.container}>
      <Image
        source={require("../../../../assets/logo-hydrus-horizontal.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Entrar</Text>
      <FormInput control={control} name="cpf" label="CPF/CNPJ" />
      <FormInput control={control} name="senha" label="Senha" secureTextEntry />
      <Pressable style={styles.row} onPress={() => setValue("lembrar", !lembrar)}>
        <View style={[styles.checkbox, lembrar && styles.checkboxChecked]} />
        <Text>Lembrar de mim</Text>
      </Pressable>
      <PrimaryButton label="Entrar" loading={loading} onPress={onSubmit} />
      <View style={styles.links}>
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>Criar conta</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("RecoverValidate")}>
          <Text style={styles.link}>Recuperar senha</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" },
  logo: { width: "100%", height: 170, marginBottom: spacing.md },
  title: { fontSize: 28, fontWeight: "700", marginBottom: spacing.lg, color: colors.text, textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.lg },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderColor: colors.border, borderWidth: 2 },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  links: { marginTop: spacing.lg, gap: spacing.sm, alignItems: "center" },
  link: { color: colors.primary, fontWeight: "600" },
});
