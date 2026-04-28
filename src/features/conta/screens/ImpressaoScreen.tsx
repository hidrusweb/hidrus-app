import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image as RNImage, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../../core/theme/theme";
import { formatCurrency, formatDate } from "../../../core/utils/format";
import type { FaixaImposto, Historico, Unidade } from "../types/conta";

type Props = { unidade: Unidade };

const LOGO_ASSET = require("../../../../assets/logo-hydrus-horizontal.png");

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMaximo(maximo: number): string {
  if (maximo > 9999) return maximo.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  return String(maximo);
}

function monthShort(mes: number): string {
  return ["", "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][mes] ?? String(mes);
}

function buildDocumentName(unidade: Unidade): string {
  const condo = String(unidade.nomeCondominio ?? "").trim();
  const unit = String(unidade.unidade || unidade.nomeUnidade || "").trim();
  const mm = String(Math.max(1, Math.min(12, Number(unidade.mesLeitura || 1)))).padStart(2, "0");
  const yyyy = String(unidade.anoLeitura || new Date().getFullYear());
  const base = `Fatura ${condo}${unit ? ` ${unit}` : ""} - ${mm}/${yyyy}`;
  return base.replace(/\s+/g, " ").trim();
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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

function buildPrintHtml(unidade: Unidade, logoUri: string, documentName: string): string {
  const bands = buildBands(unidade);
  const historico = [...(unidade.historico ?? [])]
    .sort((a, b) => b.anoLeitura - a.anoLeitura || b.mesLeitura - a.mesLeitura)
    .slice(0, 6);
  const historicoAsc = [...historico].reverse();
  const somaFaixas = bands.reduce((acc, b) => acc + b.totalFaixa, 0);
  const taxaMin = unidade.taxaMinima ?? 0;
  const unidadeLabel =
    unidade.nomeAgrupamento && (unidade.unidade || unidade.nomeUnidade)
      ? `${unidade.nomeAgrupamento} · ${unidade.unidade || unidade.nomeUnidade}`
      : unidade.unidade || unidade.nomeUnidade || "-";
  const currentPeriod = `${monthShort(unidade.mesLeitura)} / ${unidade.anoLeitura}`;
  const maxHistorico = Math.max(1, ...historicoAsc.map((h) => Math.abs(Number(h.consumoDoMes))));
  const chartWidth = 360;
  const chartHeight = 132;
  const chartPaddingX = 16;
  const chartTop = 18;
  const chartBottom = 30;
  const plotHeight = chartHeight - chartTop - chartBottom;
  const slotWidth = historicoAsc.length > 0 ? (chartWidth - chartPaddingX * 2) / historicoAsc.length : 0;
  const barWidth = Math.max(10, Math.min(24, slotWidth * 0.55));
  const baselineY = chartTop + plotHeight / 2;
  const safeMax = Math.max(1, maxHistorico);
  const svgBars = historicoAsc
    .map((h, idx) => {
      const value = Number(h.consumoDoMes);
      const ratio = Math.min(1, Math.abs(value) / safeMax);
      const barHeight = Math.max(3, Math.round(ratio * (plotHeight / 2 - 4)));
      const cx = chartPaddingX + idx * slotWidth + slotWidth / 2;
      const x = Math.round(cx - barWidth / 2);
      const y = value >= 0 ? Math.round(baselineY - barHeight) : Math.round(baselineY);
      const fill = value < 0 ? "#d97706" : h.anoLeitura === unidade.anoLeitura && h.mesLeitura === unidade.mesLeitura ? "#06b6d4" : "#64748b";
      const month = `${monthShort(h.mesLeitura)}/${String(h.anoLeitura).slice(-2)}`;
      const valueY = value >= 0 ? y - 4 : y + barHeight + 10;
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="3" ry="3" fill="${fill}" />
        <text x="${Math.round(cx)}" y="${valueY}" font-size="11" text-anchor="middle" fill="#334155" font-weight="700">${escapeHtml(h.consumoDoMes)}</text>
        <text x="${Math.round(cx)}" y="${chartHeight - 6}" font-size="10" text-anchor="middle" fill="#64748b">${escapeHtml(month)}</text>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(documentName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 20px; background: #f1f5f9; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; font-size: 14px; }
    .page { max-width: 820px; margin: 0 auto; }
    .topbar { display: flex; align-items: stretch; justify-content: space-between; gap: 14px; margin-bottom: 10px; }
    .logo { width: 240px; height: auto; display: block; object-fit: contain; }
    .topInfo {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #f3f4f6;
      padding: 10px 14px;
      display: grid;
      gap: 8px;
      align-content: center;
    }
    .topInfoRow {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      border-bottom: 1px solid #cfd6df;
      padding-bottom: 7px;
    }
    .topInfoRow:last-child { border-bottom: 0; padding-bottom: 0; }
    .topInfoMain { color: #0f172a; font-size: 19px; font-weight: 700; line-height: 1.2; }
    .topInfoSide { color: #0f172a; font-size: 19px; font-weight: 700; line-height: 1.2; }
    .topInfoSub { color: #0f172a; font-size: 14px; font-weight: 600; line-height: 1.25; }
    .topInfoSubRight { color: #0f172a; font-size: 15px; font-weight: 700; line-height: 1.2; }
    .card { background: #fff; border: 1px solid #cbd5e1; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08); }
    .cardHeader { padding: 18px 20px; background: linear-gradient(135deg, #f8fafc 0%, #fff 60%, #ecfeff 100%); border-bottom: 1px solid #e2e8f0; }
    .cardHeaderTop { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
    .eyebrow { color: #64748b; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .condo { color: #0f172a; font-size: 25px; font-weight: 800; line-height: 1.15; }
    .pill { flex-shrink: 0; display: inline-block; border-radius: 999px; padding: 7px 12px; background: #ecfeff; color: #155e75; border: 1px solid #cffafe; font-weight: 800; }
    .meta { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 18px; margin-top: 14px; color: #475569; font-size: 16px; }
    .meta b { color: #1e293b; }
    .contentGrid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, 0.82fr); gap: 20px; padding: 18px 20px; }
    .sectionTitle { color: #1e293b; font-size: 17px; font-weight: 800; margin: 0 0 12px; }
    .sectionTitleHistory { font-size: 19px; margin-bottom: 14px; }
    .metric { border-radius: 14px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; text-align: center; margin-bottom: 14px; }
    .metricLabel { color: #64748b; font-size: 14px; }
    .metricValue { color: #0f172a; font-size: 24px; font-weight: 800; margin-top: 3px; }
    .readsTitle { color: #475569; font-size: 14px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; margin: 8px 0; }
    .reads { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .readBox { border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 7px; text-align: center; }
    .readBox.current { background: #ecfeff; border-color: #bae6fd; }
    .readLabel { color: #64748b; font-size: 13px; line-height: 1.15; }
    .readBox.current .readLabel { color: #155e75; font-weight: 700; }
    .readDate { color: #0f172a; font-size: 12px; font-weight: 600; margin-top: 4px; min-height: 13px; }
    .readBox.current .readDate { font-weight: 600; font-size: 12px; letter-spacing: 0.02em; }
    .readValue { color: #0f172a; font-size: 16px; font-weight: 900; margin-top: 5px; }
    .readBoxProxima .readValue { font-size: 12px; font-weight: 600; color: #64748b; }
    .imageWrap { display: flex; align-items: center; justify-content: center; min-height: 190px; }
    .image { max-width: 100%; max-height: 260px; object-fit: contain; border-radius: 14px; border: 1px solid #e2e8f0; background: #f8fafc; }
    .noImage { width: 100%; min-height: 180px; border-radius: 14px; border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .totalBox { margin-top: 14px; border-radius: 16px; padding: 16px; text-align: center; color: #fff; background: linear-gradient(90deg, #0891b2, #1e293b); }
    .totalBox .label { color: rgba(255,255,255,0.78); font-size: 14px; }
    .totalBox .value { font-size: 26px; font-weight: 900; margin-top: 4px; }
    .section { margin-top: 18px; break-inside: avoid; }
    .box { background: #fff; border: 1px solid #cbd5e1; border-radius: 18px; overflow: hidden; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06); }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f1f5f9; color: #334155; font-size: 13px; font-weight: 800; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 10px; font-size: 13px; }
    thead th:first-child, tbody td:first-child { text-align: left; }
    thead th:last-child, tbody td:last-child { text-align: right; }
    thead th:not(:first-child):not(:last-child),
    tbody td:not(:first-child):not(:last-child) { text-align: center; }
    tfoot td:first-child { text-align: right; }
    tfoot td:last-child { text-align: right; }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    tfoot td { background: #f8fafc; font-weight: 800; }
    tfoot tr:last-child td { background: #e2e8f0; font-size: 15px; }
    .historyGrid { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: 16px; padding: 16px; }
    .timeline { border-left: 3px solid #bae6fd; padding-left: 14px; margin: 0; list-style: none; }
    .timeline li { position: relative; padding: 6px 0; color: #475569; font-size: 14px; line-height: 1.35; }
    .timeline li:before { content: ""; position: absolute; left: -20px; top: 11px; width: 9px; height: 9px; border-radius: 999px; background: #cbd5e1; }
    .timeline li.active { color: #0891b2; font-weight: 900; }
    .timeline li.active:before { background: #06b6d4; }
    .chartSvgWrap { border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; padding: 6px; }
    .chartSvg { width: 100%; height: auto; display: block; }
    @page { size: A4; margin: 50mm 30mm 30mm; }
    @media print {
      body { padding: 0; background: #fff; font-size: 11.5px; }
      .page { max-width: none; }
      .topbar { margin-bottom: 5px; gap: 8px; }
      .logo { width: 110px; }
      .topInfo { padding: 5px 8px; border-radius: 5px; gap: 4px; }
      .topInfoRow { gap: 6px; padding-bottom: 4px; }
      .topInfoMain { font-size: 12px; }
      .topInfoSide { font-size: 12px; }
      .topInfoSub { font-size: 11px; }
      .topInfoSubRight { font-size: 11px; }
      .card, .box { box-shadow: none; border-radius: 12px; }
      .cardHeader { padding: 7px 10px; }
      .eyebrow { font-size: 12px; margin-bottom: 2px; }
      .condo { font-size: 19px; }
      .pill { font-size: 11px; padding: 5px 9px; }
      .meta { margin-top: 7px; font-size: 13px; gap: 4px 10px; }
      .contentGrid { grid-template-columns: 1.05fr 0.75fr; gap: 8px; padding: 7px 9px; }
      .sectionTitle { font-size: 13px; margin-bottom: 4px; }
      .sectionTitleHistory { font-size: 14px; margin-bottom: 5px; }
      .metric { padding: 7px; margin-bottom: 6px; border-radius: 8px; }
      .metricLabel { font-size: 11px; }
      .metricValue { font-size: 16px; }
      .readsTitle { font-size: 11px; margin: 3px 0; }
      .reads { gap: 4px; }
      .readBox { border-radius: 7px; padding: 4px 2px; }
      .readLabel, .readDate { font-size: 10px; }
      .readDate { margin-top: 2px; min-height: 10px; color: #0f172a; font-weight: 600; }
      .readBox.current .readDate { font-size: 10px; font-weight: 600; }
      .readValue { font-size: 12px; margin-top: 1px; }
      .readBoxProxima .readValue { font-size: 10px; font-weight: 600; color: #64748b; }
      .imageWrap { min-height: 82px; }
      .image { max-height: 102px; border-radius: 8px; }
      .noImage { min-height: 84px; border-radius: 8px; font-size: 11px; }
      .totalBox { margin-top: 5px; border-radius: 8px; padding: 6px; }
      .totalBox .label { font-size: 11px; }
      .totalBox .value { font-size: 17px; margin-top: 1px; }
      .section { margin-top: 5px; }
      th { font-size: 11.5px; }
      th, td { padding: 4px 5px; font-size: 11.5px; }
      tfoot tr:last-child td { font-size: 12px; }
      .historyGrid { grid-template-columns: 0.75fr 1.25fr; gap: 6px; padding: 6px; }
      .timeline { padding-left: 8px; border-left-width: 2px; }
      .timeline li { padding: 2px 0; font-size: 13px; line-height: 1.3; }
      .timeline li:before { left: -15px; top: 6px; width: 6px; height: 6px; }
      .chartSvgWrap { border-radius: 8px; padding: 3px; }
    }
  </style>
</head>
<body>
  <main class="page">
    <div class="topbar">
      <img class="logo" src="${escapeHtml(logoUri)}" alt="HIDRUS Soluções Integradas" />
      <div class="topInfo">
        <div class="topInfoRow">
          <div class="topInfoMain">${escapeHtml(unidade.nomeCondominio || "-")}</div>
          <div class="topInfoSide">${escapeHtml(unidadeLabel)}</div>
        </div>
        <div class="topInfoRow">
          <div class="topInfoSub">${escapeHtml(unidade.nomeCondomino || "-")}</div>
          <div class="topInfoSubRight">${escapeHtml(unidade.hidrometro || "-")}</div>
        </div>
      </div>
    </div>

    <section class="card">
      <div class="contentGrid">
        <div>
          <h3 class="sectionTitle">Demonstrativo · ${escapeHtml(currentPeriod)}</h3>
          <div class="metric">
            <div class="metricLabel">Consumo</div>
            <div class="metricValue">${escapeHtml(unidade.consumo)} m³</div>
          </div>
          <div class="readsTitle">Leituras</div>
          <div class="reads">
            <div class="readBox">
              <div class="readLabel">Anterior</div>
              <div class="readDate">${escapeHtml(formatDate(unidade.dataLeituraAnterior))}</div>
              <div class="readValue">${escapeHtml(unidade.leituraAnterior)}</div>
            </div>
            <div class="readBox current">
              <div class="readLabel">Atual</div>
              <div class="readDate">${escapeHtml(formatDate(unidade.dataLeitura))}</div>
              <div class="readValue">${escapeHtml(unidade.leituraAtual)}</div>
            </div>
            <div class="readBox readBoxProxima">
              <div class="readLabel">Próxima leitura</div>
              <div class="readDate">${escapeHtml(formatDate(unidade.dataProximaLeitura) || "-")}</div>
              <div class="readValue">—</div>
            </div>
          </div>
        </div>
        <div class="imageWrap">
          ${
            unidade.urlImagem
              ? `<img class="image" src="${escapeHtml(unidade.urlImagem)}" />`
              : `<div class="noImage">Sem imagem</div>`
          }
        </div>
      </div>
    </section>

    <section class="section">
      <h4 class="sectionTitle">Detalhamento da conta</h4>
      <div class="box">
        <table>
          <thead>
            <tr><th>Faixa</th><th>Mín.</th><th>Máx.</th><th>Enq.</th><th>Água</th><th>Esgoto</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${
              bands.length
                ? bands
                    .map(
                      (b) => `<tr>
                        <td>${escapeHtml((b.item.nomeFaixa || b.item.nomeTabela || "").replace(/"/g, ""))}</td>
                        <td>${escapeHtml(b.item.minimo)}</td>
                        <td>${escapeHtml(formatMaximo(b.item.maximo))}</td>
                        <td>${escapeHtml(b.enquadramento)}</td>
                        <td>${escapeHtml(formatCurrency(b.item.aliquotaAgua))}</td>
                        <td>${escapeHtml(formatCurrency(b.item.aliquotaEsgoto))}</td>
                        <td><strong>${escapeHtml(formatCurrency(b.totalFaixa))}</strong></td>
                      </tr>`,
                    )
                    .join("")
                : `<tr><td colspan="7" style="text-align:center;color:#64748b;padding:24px">Nenhuma faixa para este período.</td></tr>`
            }
          </tbody>
          <tfoot>
            <tr><td colspan="6">Total Água e Esgoto</td><td>${escapeHtml(formatCurrency(somaFaixas))}</td></tr>
            <tr><td colspan="6">Tarifa mínima</td><td>${escapeHtml(formatCurrency(taxaMin))}</td></tr>
            <tr><td colspan="6">Área comum</td><td>${escapeHtml(formatCurrency(unidade.valorAreaComum))}</td></tr>
            <tr><td colspan="6">Total a pagar</td><td>${escapeHtml(formatCurrency(unidade.valorPagar))}</td></tr>
          </tfoot>
        </table>
      </div>
    </section>

    <section class="section">
      <h4 class="sectionTitle sectionTitleHistory">Histórico recente</h4>
      <div class="box historyGrid">
        <ul class="timeline">
          ${
            historico.length
              ? historico
                  .map((h) => {
                    const active = h.anoLeitura === unidade.anoLeitura && h.mesLeitura === unidade.mesLeitura;
                    return `<li class="${active ? "active" : ""}">${escapeHtml(monthShort(h.mesLeitura))}/${escapeHtml(h.anoLeitura)}: <strong>${escapeHtml(h.consumoDoMes)}</strong> m³</li>`;
                  })
                  .join("")
              : `<li>Sem histórico recente.</li>`
          }
        </ul>
        ${
          historicoAsc.length
            ? `<div class="chartSvgWrap">
                <svg class="chartSvg" viewBox="0 0 ${chartWidth} ${chartHeight}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gráfico de consumo mensal">
                  <line x1="${chartPaddingX}" y1="${baselineY}" x2="${chartWidth - chartPaddingX}" y2="${baselineY}" stroke="#94a3b8" stroke-width="1.2" />
                  <line x1="${chartPaddingX}" y1="${chartTop}" x2="${chartPaddingX}" y2="${chartHeight - chartBottom}" stroke="#e2e8f0" stroke-width="1" />
                  <line x1="${chartPaddingX}" y1="${chartHeight - chartBottom}" x2="${chartWidth - chartPaddingX}" y2="${chartHeight - chartBottom}" stroke="#e2e8f0" stroke-width="1" />
                  ${svgBars}
                </svg>
              </div>`
            : `<div style="color:#64748b;font-weight:700">Sem histórico para o gráfico.</div>`
        }
      </div>
    </section>
  </main>
</body>
</html>`;
}

export function ImpressaoScreen({ unidade }: Props) {
  const [printing, setPrinting] = useState(false);
  const bands = useMemo(() => buildBands(unidade), [unidade]);
  const logoUri = useMemo(() => RNImage.resolveAssetSource(LOGO_ASSET).uri, []);
  const documentName = useMemo(() => buildDocumentName(unidade), [unidade]);
  const html = useMemo(() => buildPrintHtml(unidade, logoUri, documentName), [documentName, logoUri, unidade]);

  const handlePrint = async () => {
    try {
      setPrinting(true);
      const rendered = await Print.printToFileAsync({ html });
      const safeName = sanitizeFileName(documentName) || "Fatura";
      const targetUri = `${FileSystem.cacheDirectory}${safeName}.pdf`;
      await FileSystem.copyAsync({ from: rendered.uri, to: targetUri });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(targetUri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: safeName,
        });
      } else {
        await Print.printAsync({ uri: targetUri });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível abrir a impressão.";
      Alert.alert("Impressão", message);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Impressão da fatura</Text>
        <Text style={styles.description}>
          Gere uma versão limpa da fatura para imprimir ou salvar em PDF pelo sistema do celular.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.printButton, pressed && styles.printButtonPressed, printing && styles.printButtonDisabled]}
          onPress={handlePrint}
          disabled={printing}
        >
          {printing ? <ActivityIndicator color="#fff" /> : <Text style={styles.printButtonText}>Imprimir fatura</Text>}
        </Pressable>
      </View>

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Prévia</Text>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Condômino</Text>
          <Text style={styles.previewValue}>{unidade.nomeCondomino || "-"}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Unidade</Text>
          <Text style={styles.previewValue}>{unidade.unidade || unidade.nomeUnidade || "-"}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Consumo</Text>
          <Text style={styles.previewValue}>{unidade.consumo} m3</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={styles.previewLabel}>Faixas</Text>
          <Text style={styles.previewValue}>{bands.length}</Text>
        </View>
        <View style={[styles.previewRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total a pagar</Text>
          <Text style={styles.totalValue}>{formatCurrency(unidade.valorPagar)}</Text>
        </View>
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
    marginBottom: spacing.md,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: spacing.xs },
  description: { fontSize: 15, color: colors.mutedText, lineHeight: 21, marginBottom: spacing.md },
  printButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  printButtonPressed: { opacity: 0.8 },
  printButtonDisabled: { opacity: 0.65 },
  printButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
  },
  previewTitle: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  previewLabel: { color: colors.mutedText, fontSize: 14 },
  previewValue: { color: colors.text, fontSize: 14, fontWeight: "600", textAlign: "right", flexShrink: 1 },
  totalRow: { borderBottomWidth: 0, marginTop: spacing.xs },
  totalLabel: { color: colors.text, fontSize: 16, fontWeight: "800" },
  totalValue: { color: colors.text, fontSize: 18, fontWeight: "800" },
});
