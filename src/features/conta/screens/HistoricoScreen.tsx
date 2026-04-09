import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Historico } from "../types/conta";
import { colors, spacing } from "../../../core/theme/theme";

type Props = { historico: Historico[] };

function formatHistoricoDateDDMMYYYY(item: Historico): string {
  const raw = item.dataLeitura?.trim();
  if (raw) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (m) {
      const [, y, mo, d] = m;
      return `${d}/${mo}/${y}`;
    }
  }
  const dd = String(1).padStart(2, "0");
  const mm = String(item.mesLeitura).padStart(2, "0");
  const yyyy = String(item.anoLeitura);
  return `${dd}/${mm}/${yyyy}`;
}

function HistoricoItemText({ item, align }: { item: Historico; align: "left" | "right" }) {
  return (
    <Text style={[styles.text, align === "left" ? styles.leftText : styles.rightText]}>
      Em <Text style={styles.textBold}>{formatHistoricoDateDDMMYYYY(item)}</Text> o{"\n"}
      consumo foi <Text style={styles.textBold}>{String(item.consumoDoMes)}</Text> m3
    </Text>
  );
}

const TIMELINE_TRACK = 24;
const DOT_ROW_MIN_HEIGHT = 60;

export function HistoricoScreen({ historico }: Props) {
  const sorted = [...historico].sort((a, b) => b.anoLeitura - a.anoLeitura || b.mesLeitura - a.mesLeitura);
  const lineTop = DOT_ROW_MIN_HEIGHT / 2;
  const lineHeight = sorted.length > 1 ? (sorted.length - 1) * DOT_ROW_MIN_HEIGHT : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {sorted.length === 0 ? (
          <Text style={styles.emptyText}>Nao ha dados de historico para esta unidade.</Text>
        ) : (
          <View style={styles.timelineRow}>
            <View style={styles.colText}>
              {sorted.map((item, index) => (
                <View key={`l-${item.anoLeitura}-${item.mesLeitura}`} style={styles.textCell}>
                  {index % 2 === 0 ? <HistoricoItemText item={item} align="left" /> : null}
                </View>
              ))}
            </View>
            <View style={styles.colTrack}>
              {sorted.length > 1 ? (
                <View style={[styles.timelineLine, { top: lineTop, height: lineHeight }]} />
              ) : null}
              {sorted.map((item, index) => (
                <View key={`d-${item.anoLeitura}-${item.mesLeitura}`} style={styles.dotCell}>
                  <View style={[styles.dot, index === 0 && styles.dotFilled]} />
                </View>
              ))}
            </View>
            <View style={styles.colText}>
              {sorted.map((item, index) => (
                <View key={`r-${item.anoLeitura}-${item.mesLeitura}`} style={styles.textCell}>
                  {index % 2 === 1 ? <HistoricoItemText item={item} align="right" /> : null}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: 16, paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  timelineRow: { flexDirection: "row", alignItems: "stretch" },
  colText: { flex: 1, minWidth: 0 },
  textCell: { minHeight: DOT_ROW_MIN_HEIGHT, justifyContent: "center" },
  colTrack: {
    width: TIMELINE_TRACK,
    position: "relative",
    alignItems: "center",
  },
  timelineLine: {
    position: "absolute",
    left: TIMELINE_TRACK / 2 - 1,
    width: 2,
    backgroundColor: "#233B70",
  },
  dotCell: {
    minHeight: DOT_ROW_MIN_HEIGHT,
    width: TIMELINE_TRACK,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#233B70",
    backgroundColor: colors.surface,
  },
  dotFilled: {
    backgroundColor: "#233B70",
    borderColor: "#233B70",
  },
  text: { fontSize: 15, color: colors.text, lineHeight: 20 },
  textBold: { fontWeight: "700", color: colors.text },
  leftText: { textAlign: "right", paddingRight: spacing.sm },
  rightText: { textAlign: "left", paddingLeft: spacing.sm },
  emptyText: { textAlign: "center", color: colors.mutedText, marginTop: spacing.md },
});
