import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { FaixaImposto, Unidade } from "../types/conta";
import { colors, spacing } from "../../../core/theme/theme";
import { formatCurrency } from "../../../core/utils/format";

type Props = { unidade: Unidade };

const COL = {
  faixa: 112,
  min: 52,
  max: 76,
  enq: 56,
  agua: 92,
  esgoto: 92,
  total: 100,
} as const;

const HEADER_BG = "#B8C5D6";
const TOTAL_BAR_BG = "#E8EBF0";

function buildBands(unidade: Unidade): { item: FaixaImposto; totalFaixa: number; enquadramento: number }[] {
  return [...(unidade.faixaImposto ?? [])]
    .filter((f) => f.tipoFaixa !== 2)
    .sort((a, b) => a.ordenacao - b.ordenacao)
    .map((item) => {
      const eq = unidade.faixasEnquadramento.find((e) => e.ordemFaixa === item.ordenacao);
      return {
        item,
        totalFaixa: eq?.totalFaixa ?? 0,
        enquadramento: eq?.enquadramento ?? 0,
      };
    });
}

function formatMaximo(maximo: number): string {
  if (maximo > 9999) return maximo.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  return String(maximo);
}

export function DetalhamentoScreen({ unidade }: Props) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const bands = buildBands(unidade);
  const somaFaixas = bands.reduce((acc, b) => acc + b.totalFaixa, 0);

  const tableMinWidth =
    COL.faixa + COL.min + COL.max + COL.enq + COL.agua + COL.esgoto + COL.total + spacing.md * 2;

  const scrollBottomPad = tabBarHeight + Math.max(insets.bottom, spacing.sm) + spacing.md;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        <Text style={styles.pageTitle}>DETALHAMENTO DA CONTA</Text>

        <View style={styles.tableBlock}>
          <View style={styles.card}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator
              nestedScrollEnabled
              contentContainerStyle={{ minWidth: tableMinWidth }}
            >
              <View style={styles.tableInner}>
                <View style={[styles.row, styles.headerRow]}>
                  <Text style={[styles.hCell, styles.colFaixa]}>Faixa</Text>
                  <Text style={[styles.hCell, styles.colMin]}>Mín.</Text>
                  <Text style={[styles.hCell, styles.colMax]}>Máx.</Text>
                  <Text style={[styles.hCell, styles.colEnq]}>Enq.</Text>
                  <Text style={[styles.hCell, styles.colMoney]}>Água</Text>
                  <Text style={[styles.hCell, styles.colMoney]}>Esgoto</Text>
                  <Text style={[styles.hCell, styles.colTotal]}>Total</Text>
                </View>

                {bands.map((b, index) => (
                  <View key={`${b.item.id}-${b.item.ordenacao}`} style={[styles.row, index % 2 === 1 && styles.zebra]}>
                    <Text style={[styles.cell, styles.colFaixa, styles.cellLeft]} numberOfLines={2}>
                      {(b.item.nomeFaixa || b.item.nomeTabela || "").toUpperCase()}
                    </Text>
                    <Text style={[styles.cell, styles.colMin]}>{b.item.minimo}</Text>
                    <Text style={[styles.cell, styles.colMax]}>{formatMaximo(b.item.maximo)}</Text>
                    <Text style={[styles.cell, styles.colEnq]}>{b.enquadramento}</Text>
                    <Text style={[styles.cell, styles.colMoney]}>{formatCurrency(b.item.aliquotaAgua)}</Text>
                    <Text style={[styles.cell, styles.colMoney]}>{formatCurrency(b.item.aliquotaEsgoto)}</Text>
                    <Text style={[styles.cellStrong, styles.colTotal]}>{formatCurrency(b.totalFaixa)}</Text>
                  </View>
                ))}

                {bands.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <Text style={styles.emptyText}>Nenhuma faixa disponível para este período.</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </View>

        <View style={styles.footerSection}>
          <View style={styles.footerCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total faixas (variável)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(somaFaixas)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tarifa mínima</Text>
              <Text style={styles.summaryValue}>{formatCurrency(unidade.taxaMinima)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Área comum</Text>
              <Text style={styles.summaryValue}>{formatCurrency(unidade.valorAreaComum)}</Text>
            </View>

            <View style={styles.totalBar}>
              <Text style={styles.totalBarLabel}>Total a pagar</Text>
              <Text style={styles.totalBarValue}>{formatCurrency(unidade.valorPagar)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageScroll: {
    flex: 1,
  },
  pageTitle: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
    color: colors.text,
  },
  tableBlock: {
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tableInner: {
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 46,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerRow: {
    backgroundColor: HEADER_BG,
    minHeight: 44,
  },
  hCell: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D3748",
    textAlign: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  cell: {
    fontSize: 13,
    color: colors.text,
    textAlign: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  cellStrong: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    textAlign: "right",
    paddingVertical: spacing.sm,
    paddingHorizontal: 6,
  },
  cellLeft: {
    textAlign: "left",
    paddingLeft: spacing.sm,
    fontWeight: "600",
  },
  colFaixa: { width: COL.faixa },
  colMin: { width: COL.min },
  colMax: { width: COL.max },
  colEnq: { width: COL.enq },
  colMoney: { width: COL.agua },
  colTotal: { width: COL.total },
  zebra: { backgroundColor: "#F7F8FA" },
  emptyRow: { padding: spacing.lg },
  emptyText: { color: colors.mutedText, textAlign: "center", fontSize: 14 },
  footerSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    paddingRight: spacing.sm,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    textAlign: "right",
  },
  totalBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: TOTAL_BAR_BG,
  },
  totalBarLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  totalBarValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
});
