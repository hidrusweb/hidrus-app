import { Picker } from "@react-native-picker/picker";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../../core/theme/theme";
import { PrimaryButton } from "../../../shared/components/PrimaryButton";
import { useAuthStore } from "../../auth/store/useAuthStore";
import { getConsumoPeriodos, getUnidade, getUnidades, monthOptions } from "../services/contaService";
import type { UnidadeOption } from "../types/conta";
import type { AppStackParamList } from "../../../navigation/types";

export function GenerateBillScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuthStore();
  const [mes, setMes] = useState<number | null>(null);
  const [ano, setAno] = useState<number | null>(null);
  const [unidadeId, setUnidadeId] = useState<number | null>(null);
  const [anos, setAnos] = useState<number[]>([]);
  const [mesesDisponiveis, setMesesDisponiveis] = useState<number[]>([]);
  const [mesesPorAno, setMesesPorAno] = useState<Record<number, number[]>>({});
  const [unidades, setUnidades] = useState<UnidadeOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const loginId = user?.loginId || user?.email || user?.cpf || "";
        const [periodos, units] = await Promise.all([getConsumoPeriodos(), getUnidades(loginId)]);
        setAnos(periodos.anos);
        setMesesPorAno(periodos.mesesPorAno);
        const firstAno = periodos.anos[0] ?? null;
        const firstMes = firstAno ? periodos.mesesPorAno[firstAno]?.[0] ?? null : null;
        setAno(firstAno);
        setMes(firstMes);
        setMesesDisponiveis(firstAno ? periodos.mesesPorAno[firstAno] ?? [] : []);
        setUnidades(units);
        setUnidadeId(units[0]?.value ?? null);
      } catch (error) {
        Alert.alert("Erro", (error as Error).message);
      }
    })();
  }, [user?.loginId, user?.email, user?.cpf]);

  useEffect(() => {
    if (!ano) {
      setMesesDisponiveis([]);
      setMes(null);
      return;
    }
    const meses = mesesPorAno[ano] ?? [];
    setMesesDisponiveis(meses);
    if (!mes || !meses.includes(mes)) {
      setMes(meses[0] ?? null);
    }
  }, [ano, mesesPorAno, mes]);

  const onGenerate = async () => {
    if (!ano || !mes || !unidadeId) return;
    setLoading(true);
    try {
      const unidade = await getUnidade(unidadeId, mes, ano);
      navigation.navigate("BillTabs", { unidade });
    } catch (error) {
      Alert.alert("Erro", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const openIosSelect = (
    title: string,
    options: Array<{ label: string; value: number }>,
    onSelect: (value: number) => void,
  ) => {
    const labels = options.map((o) => o.label);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...labels, "Cancelar"],
        cancelButtonIndex: labels.length,
      },
      (buttonIndex) => {
        if (buttonIndex < labels.length) {
          const selected = options[buttonIndex];
          if (selected) onSelect(selected.value);
        }
      },
    );
  };

  const anoOptions = anos.map((item) => ({ label: String(item), value: item }));
  const mesOptions = monthOptions
    .filter((m) => mesesDisponiveis.includes(m.value))
    .map((m) => ({ label: m.label, value: m.value }));
  const unidadeOptions = unidades.map((item) => ({ label: item.label, value: item.value }));

  const anoLabel = anoOptions.find((o) => o.value === ano)?.label ?? "Selecione";
  const mesLabel = mesOptions.find((o) => o.value === mes)?.label ?? "Selecione";
  const unidadeLabel = unidadeOptions.find((o) => o.value === unidadeId)?.label ?? "Selecione";

  const renderSelect = (
    label: string,
    selectedLabel: string,
    options: Array<{ label: string; value: number }>,
    onSelect: (value: number) => void,
    picker: React.ReactNode,
  ) => {
    if (Platform.OS === "ios") {
      return (
        <>
          <Text style={styles.label}>{label}</Text>
          <Pressable style={styles.iosSelect} onPress={() => openIosSelect(label, options, onSelect)}>
            <Text numberOfLines={1} style={styles.iosSelectText}>
              {selectedLabel}
            </Text>
            <Text style={styles.iosSelectArrow}>▾</Text>
          </Pressable>
        </>
      );
    }

    return (
      <>
        <Text style={styles.label}>{label}</Text>
        {picker}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gerar conta</Text>
      <Text style={styles.subtitle}>{user?.nome}</Text>
      {renderSelect(
        "Ano de consumo",
        anoLabel,
        anoOptions,
        setAno,
        <Picker mode="dropdown" selectedValue={ano ?? undefined} onValueChange={setAno} style={styles.picker}>
          {anos.map((item) => (
            <Picker.Item key={item} label={String(item)} value={item} />
          ))}
        </Picker>,
      )}
      {renderSelect(
        "Mes de consumo",
        mesLabel,
        mesOptions,
        setMes,
        <Picker mode="dropdown" selectedValue={mes ?? undefined} onValueChange={setMes} style={styles.picker}>
          {mesOptions.map((m) => (
            <Picker.Item key={m.value} label={m.label} value={m.value} />
          ))}
        </Picker>,
      )}
      {renderSelect(
        "Unidade",
        unidadeLabel,
        unidadeOptions,
        setUnidadeId,
        <Picker mode="dropdown" selectedValue={unidadeId ?? undefined} onValueChange={setUnidadeId} style={styles.picker}>
          {unidades.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>,
      )}
      <PrimaryButton label="Gerar Conta" loading={loading} onPress={onGenerate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { fontSize: 28, fontWeight: "700", marginBottom: spacing.xs, color: colors.text },
  subtitle: { color: colors.mutedText, marginBottom: spacing.lg, fontSize: 16 },
  label: { color: colors.mutedText, fontWeight: "600" },
  picker: { backgroundColor: colors.surface, marginBottom: spacing.md, borderRadius: 12 },
  iosSelect: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iosSelectText: {
    flex: 1,
    color: colors.text,
  },
  iosSelectArrow: {
    color: colors.mutedText,
    marginLeft: spacing.sm,
    fontSize: 16,
  },
});
