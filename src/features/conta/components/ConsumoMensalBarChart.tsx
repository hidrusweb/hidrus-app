import { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, G, Line, LinearGradient, Rect, Stop, Text as SvgText } from "react-native-svg";
import { colors, spacing } from "../../../core/theme/theme";

const MONTHS_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const CHART = {
  positiveFrom: "#8FA8C4",
  positiveTo: "#5A6A7E",
  negativeFrom: "#E8A878",
  negativeTo: "#C45D20",
  highlightFrom: "#3DD9EE",
  highlightTo: "#0198C8",
  highlightStroke: "#01C8E0",
  grid: "#E0E7F0",
  zeroLine: "#4A5568",
};

export type ConsumoPonto = { mes: number; ano: number; consumo: number };

type Props = { data: ConsumoPonto[] };

function formatNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const s = n.toFixed(1);
  return s.endsWith(".0") ? String(Math.round(n)) : s;
}

function formatTick(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (Math.abs(r - Math.round(r)) < 1e-6) return String(Math.round(r));
  return r.toFixed(1);
}

function buildDomain(values: number[]): { min: number; max: number; ticks: number[] } {
  if (values.length === 0) return { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1] };
  const rawMin = Math.min(...values, 0);
  const rawMax = Math.max(...values, 0);
  const span = rawMax - rawMin || 1;
  const pad = Math.max(span * 0.12, 1);
  let min = rawMin - pad;
  let max = rawMax + pad;
  if (min >= 0 && rawMin >= 0) min = Math.min(0, rawMin - pad * 0.5);
  if (max <= 0 && rawMax <= 0) max = Math.max(0, rawMax + pad * 0.5);
  const count = 5;
  const ticks = Array.from({ length: count }, (_, i) => min + ((max - min) * (count - 1 - i)) / (count - 1));
  return { min, max, ticks };
}

export function ConsumoMensalBarChart({ data }: Props) {
  const [layoutW, setLayoutW] = useState(320);
  const uid = useMemo(() => `c${Math.random().toString(36).slice(2, 9)}`, []);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setLayoutW(w);
  };

  const computed = useMemo(() => {
    if (!data.length) return null;
    const consumos = data.map((d) => d.consumo);
    const dataMin = Math.min(...consumos);
    const dataMax = Math.max(...consumos);
    const { min: domainMin, max: domainMax, ticks } = buildDomain(consumos);
    return { dataMin, dataMax, domainMin, domainMax, ticks };
  }, [data]);

  const CHART_H = 208;
  const TOP = 26;
  const BOTTOM = 34;
  const LEFT = 42;
  const RIGHT = 8;
  const plotH = CHART_H - TOP - BOTTOM;
  const plotW = Math.max(layoutW - LEFT - RIGHT, 80);

  const yScale = (domainMin: number, domainMax: number) => (v: number) =>
    TOP + ((domainMax - v) / (domainMax - domainMin || 1)) * plotH;

  if (!data.length || !computed) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sem dados para o grafico.</Text>
      </View>
    );
  }

  const { dataMin, dataMax, domainMin, domainMax, ticks } = computed;
  const ys = yScale(domainMin, domainMax);
  const zeroY = ys(0);
  const n = data.length;
  const slotW = plotW / n;
  const barW = Math.min(28, slotW * 0.62);

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Consumo mensal (m³)</Text>
        <Text style={styles.periodLine}>
          No período:{" "}
          <Text style={dataMin < 0 ? styles.periodMinNeg : styles.periodMin}>{formatNum(dataMin)}</Text>
          <Text style={styles.periodSep}> — </Text>
          <Text style={styles.periodMax}>{formatNum(dataMax)}</Text>
        </Text>
      </View>

      <Svg width={layoutW} height={CHART_H}>
        <Defs>
          <LinearGradient id={`${uid}-pos`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={CHART.positiveFrom} />
            <Stop offset="1" stopColor={CHART.positiveTo} />
          </LinearGradient>
          <LinearGradient id={`${uid}-neg`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={CHART.negativeFrom} />
            <Stop offset="1" stopColor={CHART.negativeTo} />
          </LinearGradient>
          <LinearGradient id={`${uid}-hi`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={CHART.highlightFrom} />
            <Stop offset="1" stopColor={CHART.highlightTo} />
          </LinearGradient>
        </Defs>

        {ticks.map((t, i) => {
          if (domainMin < 0 && domainMax > 0 && Math.abs(t) < 1e-8) return null;
          const y = ys(t);
          return (
            <Line
              key={`grid-${i}`}
              x1={LEFT}
              y1={y}
              x2={LEFT + plotW}
              y2={y}
              stroke={CHART.grid}
              strokeWidth={1}
              strokeDasharray="5 5"
            />
          );
        })}
        {domainMin < 0 && domainMax > 0 ? (
          <Line
            x1={LEFT}
            y1={zeroY}
            x2={LEFT + plotW}
            y2={zeroY}
            stroke={CHART.zeroLine}
            strokeWidth={1.5}
          />
        ) : null}

        {ticks.map((t, i) => (
          <SvgText
            key={`yl-${i}`}
            x={LEFT - 6}
            y={ys(t) + 4}
            fontSize={11}
            fill={colors.mutedText}
            textAnchor="end"
          >
            {formatTick(t)}
          </SvgText>
        ))}

        {data.map((p, idx) => {
          const v = p.consumo;
          const cx = LEFT + slotW * idx + slotW / 2;
          const x = cx - barW / 2;
          const yV = ys(v);
          const yTop = Math.min(zeroY, yV);
          const yBottom = Math.max(zeroY, yV);
          const h = Math.max(yBottom - yTop, v === 0 ? 0 : 1);
          const isLast = idx === n - 1;
          const labelY = yTop - 6;
          const label = formatNum(v);

          if (Math.abs(v) < 1e-9) {
            return (
              <G key={`b-${idx}`}>
                <SvgText
                  x={cx}
                  y={zeroY - 8}
                  fontSize={12}
                  fill={colors.text}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  0
                </SvgText>
              </G>
            );
          }

          const fillId = isLast ? `${uid}-hi` : v < 0 ? `${uid}-neg` : `${uid}-pos`;
          const labelFill = isLast ? CHART.highlightStroke : v < 0 ? "#D35400" : colors.text;

          return (
            <G key={`b-${idx}`}>
              {isLast ? (
                <Rect
                  x={x - 3}
                  y={yTop - 3}
                  width={barW + 6}
                  height={h + 6}
                  rx={8}
                  fill="none"
                  stroke={CHART.highlightStroke}
                  strokeWidth={2}
                  opacity={0.9}
                />
              ) : null}
              <Rect x={x} y={yTop} width={barW} height={h} rx={5} fill={`url(#${fillId})`} />
              <SvgText
                x={cx}
                y={labelY}
                fontSize={12}
                fill={labelFill}
                textAnchor="middle"
                fontWeight="600"
              >
                {label}
              </SvgText>
            </G>
          );
        })}

        {data.map((p, idx) => {
          const cx = LEFT + slotW * idx + slotW / 2;
          const lab = `${MONTHS_PT[Math.max(0, Math.min(11, p.mes - 1))]}/${String(p.ano).slice(-2)}`;
          return (
            <SvgText
              key={`x-${idx}`}
              x={cx}
              y={CHART_H - 10}
              fontSize={10}
              fill={colors.mutedText}
              textAnchor="middle"
            >
              {lab}
            </SvgText>
          );
        })}
      </Svg>

      <Text style={styles.footer}>
        Escala: {formatTick(domainMin)} a {formatTick(domainMax)} m³ (linha escura = zero).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  headerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 17,
    flexShrink: 1,
  },
  periodLine: { fontSize: 13, color: colors.mutedText },
  periodMin: { color: colors.text, fontWeight: "700" },
  periodMinNeg: { color: "#D35400", fontWeight: "700" },
  periodSep: { color: colors.mutedText, fontWeight: "400" },
  periodMax: { color: "#233B70", fontWeight: "700" },
  footer: {
    marginTop: spacing.sm,
    fontSize: 11,
    color: colors.mutedText,
  },
  empty: { paddingVertical: spacing.lg, alignItems: "center" },
  emptyText: { color: colors.mutedText, fontSize: 15 },
});
