import { useCallback, useEffect, useState } from "react";
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { getApiBaseUrl } from "../../../core/config/env";
import { colors, spacing } from "../../../core/theme/theme";
import { formatCurrency, formatDate } from "../../../core/utils/format";
import type { Unidade } from "../types/conta";

type Props = { unidade: Unidade };

type ImgPhase = "empty" | "pending" | "ok" | "error";

export function DemonstrativoScreen({ unidade }: Props) {
  const uri = unidade.urlImagem?.trim() ?? "";
  const apiBase = getApiBaseUrl();
  const [phase, setPhase] = useState<ImgPhase>(uri ? "pending" : "empty");
  const [rnError, setRnError] = useState("");
  const [fetchDiag, setFetchDiag] = useState("");

  useEffect(() => {
    setRnError("");
    setFetchDiag("");
    setPhase(uri ? "pending" : "empty");
  }, [uri]);

  const onImgError = useCallback(
    (e: { nativeEvent?: { error?: string } }) => {
      const msg = e.nativeEvent?.error ?? "erro desconhecido";
      setRnError(String(msg));
      setPhase("error");
      console.log("[IMG][ERR]", uri, msg);
    },
    [uri],
  );

  const onImgLoad = useCallback(() => {
    setRnError("");
    setPhase("ok");
  }, []);

  const runFetchProbe = useCallback(async () => {
    if (!uri) return;
    setFetchDiag("Testando…");
    try {
      const res = await fetch(uri, { method: "HEAD" });
      setFetchDiag(`HEAD ${res.status} ${res.statusText || ""}`.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFetchDiag(`HEAD falhou: ${msg}`);
    }
  }, [uri]);

  const statusLabel =
    phase === "empty"
      ? "Sem URL"
      : phase === "pending"
        ? "Aguardando imagem…"
        : phase === "ok"
          ? "Imagem carregou (RN)"
          : "Falha ao renderizar (RN)";

  const isHttp = /^http:\/\//i.test(uri);
  const buildMode = __DEV__ ? "development" : "release";

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

        <View style={styles.imageBlock}>
          <Text style={styles.debugTitle}>Debug da imagem (APK / release)</Text>
          <View style={[styles.statusPill, phase === "ok" && styles.statusOk, phase === "error" && styles.statusErr]}>
            <Text style={styles.statusPillText}>{statusLabel}</Text>
          </View>
          {isHttp ? (
            <Text style={styles.warn}>
              URL em HTTP: no Android release o tráfego sem TLS costuma ser bloqueado (cleartext). Prefira HTTPS ou
              habilite cleartext no build nativo.
            </Text>
          ) : null}
          <Text style={styles.debugMeta}>
            {Platform.OS} · build {buildMode} · API {apiBase}
          </Text>
          {uri ? (
            <>
              <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="cover"
                onLoad={onImgLoad}
                onError={onImgError}
              />
              <Text style={styles.debugUrl} selectable>
                {uri}
              </Text>
              {rnError ? (
                <Text style={styles.debugErr} selectable>
                  RN Image: {rnError}
                </Text>
              ) : null}
              <Pressable style={styles.debugBtn} onPress={runFetchProbe}>
                <Text style={styles.debugBtnText}>Testar rede (HEAD)</Text>
              </Pressable>
              {fetchDiag ? (
                <Text style={styles.debugFetch} selectable>
                  {fetchDiag}
                </Text>
              ) : null}
              <Pressable style={styles.debugBtnSecondary} onPress={() => Linking.openURL(uri)}>
                <Text style={styles.debugBtnText}>Abrir URL no navegador</Text>
              </Pressable>
            </>
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Text style={styles.imageFallbackText}>Imagem indisponivel</Text>
            </View>
          )}
        </View>
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
  imageBlock: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    backgroundColor: "#F8FAFC",
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedText,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    marginBottom: spacing.sm,
  },
  statusOk: { backgroundColor: "#D1FAE5" },
  statusErr: { backgroundColor: "#FEE2E2" },
  statusPillText: { fontSize: 12, fontWeight: "700", color: colors.text },
  warn: {
    fontSize: 12,
    color: "#B45309",
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  debugMeta: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: colors.mutedText,
    marginBottom: spacing.sm,
  },
  image: { width: "100%", height: 170, borderRadius: 10, backgroundColor: "#E2E8F0" },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  imageFallbackText: { color: colors.mutedText, fontSize: 14 },
  debugUrl: {
    marginTop: spacing.sm,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: colors.text,
    lineHeight: 15,
  },
  debugErr: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: colors.danger,
    lineHeight: 15,
  },
  debugBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  debugBtnSecondary: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: "#64748B",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  debugBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  debugFetch: {
    marginTop: spacing.xs,
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: colors.text,
  },
});
