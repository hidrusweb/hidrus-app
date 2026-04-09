import { ScrollView, StyleSheet, View } from "react-native";
import { ConsumoMensalBarChart } from "../components/ConsumoMensalBarChart";
import type { Historico } from "../types/conta";
import { colors, spacing } from "../../../core/theme/theme";

type Props = { historico: Historico[] };

export function EvolucaoScreen({ historico }: Props) {
  const sorted = [...historico].sort((a, b) => a.anoLeitura - b.anoLeitura || a.mesLeitura - b.mesLeitura);
  const data = sorted.map((item) => ({
    mes: item.mesLeitura,
    ano: item.anoLeitura,
    consumo: item.consumoDoMes,
  }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <ConsumoMensalBarChart data={data} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
