import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Unidade } from "../types/conta";
import { colors, spacing } from "../../../core/theme/theme";
import { formatCurrency, formatDate } from "../../../core/utils/format";

type Props = { unidade: Unidade };

export function DemonstrativoScreen({ unidade }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Demonstrativo de Conta</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Leitura anterior:</Text>
          <Text style={styles.value}>{unidade.leituraAnterior} ({formatDate(unidade.dataLeituraAnterior)})</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Leitura atual:</Text>
          <Text style={styles.value}>{unidade.leituraAtual} ({formatDate(unidade.dataLeitura)})</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Consumo:</Text>
          <Text style={styles.value}>{unidade.consumo} m3</Text>
        </View>
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.label}>Valor:</Text>
          <Text style={styles.total}>{formatCurrency(unidade.valorPagar)}</Text>
        </View>
        <View style={styles.nextRead}>
          <Text style={styles.nextReadText}>Proxima leitura: {formatDate(unidade.dataProximaLeitura)}</Text>
        </View>
        {unidade.urlImagem ? (
          <Image
            source={{ uri: unidade.urlImagem }}
            style={styles.image}
            resizeMode="cover"
            onError={() => {
              console.log("[IMG][ERR] Falha ao carregar imagem:", unidade.urlImagem);
            }}
          />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>Imagem indisponivel</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md },
  title: { fontWeight: "700", marginBottom: spacing.md, color: colors.text, fontSize: 22, textAlign: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, marginBottom: spacing.xs },
  totalRow: { marginTop: spacing.sm, marginBottom: spacing.md },
  label: { fontSize: 18, fontWeight: "700", color: colors.text },
  value: { fontSize: 18, color: colors.text, textAlign: "right", flexShrink: 1 },
  total: { fontSize: 20, fontWeight: "700", color: colors.text },
  nextRead: { backgroundColor: "#233B70", borderRadius: 12, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  nextReadText: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
  image: { width: "100%", height: 170, borderRadius: 10, backgroundColor: "#F1F5F9" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  imageFallbackText: { color: colors.mutedText, fontSize: 14 },
});
