import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatCurrency, formatDate, monthNames } from "../../../core/utils/format";
import { colors, spacing } from "../../../core/theme/theme";
import type { AppStackParamList } from "../../../navigation/types";
import { useAuthStore } from "../../auth/store/useAuthStore";
import type { ContaResumoItem, UnidadeOption } from "../types/conta";
import {
  clearContaApiCaches,
  getResumoContasPorUnidade,
  getUnidade,
  getUnidades,
} from "../services/contaService";

const PAGE_SIZE = 10;
type Nav = NativeStackNavigationProp<AppStackParamList>;

function ContaResumoCard({
  item,
  onOpen,
  loadingOpen,
  disabled,
}: {
  item: ContaResumoItem;
  onOpen: (item: ContaResumoItem) => void;
  loadingOpen?: boolean;
  disabled?: boolean;
}) {
  const mesLabel = monthNames[item.mes - 1] ?? "";
  return (
    <Pressable
      onPress={() => onOpen(item)}
      disabled={loadingOpen || disabled}
      style={({ pressed }) => [
        styles.card,
        disabled && !loadingOpen && styles.cardDisabled,
        pressed && !loadingOpen && !disabled && styles.cardPressed,
      ]}
    >
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardMonth}>{mesLabel}</Text>
        <Text style={styles.cardYear}>{item.ano}</Text>
      </View>
      {/* <Text style={styles.cardUnit} numberOfLines={2}>
        {item.rotuloUnidade}
      </Text> */}
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Total</Text>
        <Text style={[styles.cardValue, styles.cardTotal]}>{formatCurrency(item.valorTotal)}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Data da leitura</Text>
        <Text style={styles.cardValue}>{formatDate(item.dataLeitura ?? "") || "—"}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Leitura anterior</Text>
        <Text style={styles.cardValue}>{item.leituraAnterior.toLocaleString("pt-BR")}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Leitura atual</Text>
        <Text style={styles.cardValue}>{item.leituraAtual.toLocaleString("pt-BR")}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Consumo</Text>
        <Text style={styles.cardValue}>{item.consumo.toLocaleString("pt-BR")} m³</Text>
      </View>
      {loadingOpen ? (
        <View style={styles.cardLoadingOverlay}>
          <ActivityIndicator color={colors.secondary} />
          <Text style={styles.cardLoadingText}>Abrindo conta...</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ContaListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const loginId = user?.loginId || user?.email || user?.cpf || "";

  const [selectedUnit, setSelectedUnit] = useState<UnidadeOption | null>(null);
  const [items, setItems] = useState<ContaResumoItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingKey, setOpeningKey] = useState<string | null>(null);

  const loadPage = useCallback(
    async (unit: UnidadeOption, targetPage: number, reset: boolean) => {
      const res = await getResumoContasPorUnidade(unit, targetPage, PAGE_SIZE);
      setHasMore(res.hasMore);
      setPage(res.page);
      setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
    },
    [],
  );

  const loadInitial = useCallback(async () => {
    if (!loginId) {
      setSelectedUnit(null);
      setItems([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const units = await getUnidades(loginId);
      const unit = units[0] ?? null;
      setSelectedUnit(unit);
      if (!unit) {
        setItems([]);
        setHasMore(false);
      } else {
        await loadPage(unit, 1, true);
      }
    } catch (e) {
      setError((e as Error).message);
      setItems([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loadPage, loginId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearContaApiCaches();
    await loadInitial();
    setRefreshing(false);
  }, [loadInitial]);

  const onEndReached = useCallback(async () => {
    if (!selectedUnit || !hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      await loadPage(selectedUnit, page + 1, false);
    } finally {
      setLoadingMore(false);
    }
  }, [selectedUnit, hasMore, loadingMore, loading, loadPage, page]);

  const onOpenCard = useCallback(
    async (item: ContaResumoItem) => {
      if (openingKey) return;
      const key = `${item.idUnidade}-${item.periodoFim}`;
      setOpeningKey(key);
      try {
        const unidade = await getUnidade(item.idUnidade, item.mes, item.ano);
        navigation.navigate("BillTabs", { unidade });
      } finally {
        setOpeningKey(null);
      }
    },
    [navigation],
  );

  if (!loginId) {
    return (
      <View style={[styles.centered, { paddingBottom: insets.bottom }]}>
        <Text style={styles.muted}>Faça login para ver suas contas.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingBottom: insets.bottom, paddingHorizontal: spacing.lg }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={loadInitial} style={styles.retryBtn}>
          <Text style={styles.retryLabel}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedUnit ? (
        <Text style={styles.unitBadge} numberOfLines={1}>
          {selectedUnit.nomeCondominio}: {selectedUnit.nomeAgrupamento} - {selectedUnit.nomeUnidade}
        </Text>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(k) => `${k.idUnidade}-${k.periodoFim}`}
        renderItem={({ item }) => {
          const key = `${item.idUnidade}-${item.periodoFim}`;
          return (
            <ContaResumoCard
              item={item}
              onOpen={onOpenCard}
              loadingOpen={openingKey === key}
              disabled={Boolean(openingKey) && openingKey !== key}
            />
          );
        }}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={7}
        updateCellsBatchingPeriod={80}
        removeClippedSubviews={Platform.OS === "android"}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.muted}>Nenhuma conta encontrada.</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore || openingKey ? (
            <ActivityIndicator style={styles.footerLoader} color={colors.mutedText} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  unitBadge: {
    color: colors.secondary,
    fontWeight: "600",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  muted: { color: colors.mutedText, fontSize: 16, textAlign: "center" },
  emptyWrap: { paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  errorText: { color: colors.danger, textAlign: "center", marginBottom: spacing.md },
  retryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  retryLabel: { color: "#fff", fontWeight: "600" },
  footerLoader: { marginVertical: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardPressed: { opacity: 0.92 },
  cardDisabled: { opacity: 0.6 },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cardMonth: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cardYear: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cardUnit: { fontSize: 14, color: colors.mutedText, marginBottom: spacing.sm },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xs },
  cardLabel: { color: colors.mutedText, fontSize: 14 },
  cardValue: { color: colors.text, fontSize: 15, fontWeight: "600" },
  cardTotal: { color: colors.primary, fontSize: 16 },
  cardLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.82)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cardLoadingText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: "600",
  },
});
