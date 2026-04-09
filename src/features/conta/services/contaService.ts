import { apiClient, normalizeApiError } from "../../../core/api/client";
import { getApiBaseUrl } from "../../../core/config/env";
import type {
  FaixaImposto,
  Unidade,
  UnidadeOption,
} from "../types/conta";

function pick<T = any>(obj: any, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (obj && obj[key] !== undefined) return obj[key] as T;
  }
  return undefined;
}

/** Backend `TaxRangesController::byTable` devolve o array na raiz do JSON (nao `{ data: [...] }`). */
function normalizeFaixaImpostoFromApi(raw: any): FaixaImposto {
  return {
    id: Number(pick(raw, "id", "Id") ?? 0),
    idTabelaImposto: Number(pick(raw, "idTabelaImposto", "IdTabelaImposto") ?? 0),
    minimo: Number(pick(raw, "minimo", "Min", "Minimo") ?? 0),
    maximo: Number(pick(raw, "maximo", "Max", "Maximo") ?? 0),
    tipoFaixa: Number(pick(raw, "tipoFaixa", "TipoFaixa") ?? 1),
    ordenacao: Number(pick(raw, "ordenacao", "Ordem") ?? 0),
    nomeFaixa: String(pick(raw, "nomeFaixa", "NomeFaixa", "nome", "Nome") ?? ""),
    nomeTabela: String(pick(raw, "nomeTabela", "NomeTabela") ?? ""),
    aliquotaAgua: Number(pick(raw, "aliquotaAgua", "AliquotaAgua") ?? 0),
    aliquotaEsgoto: Number(pick(raw, "aliquotaEsgoto", "AliquotaEsgoto") ?? 0),
    total: pick(raw, "total", "Total") !== undefined ? Number(pick(raw, "total", "Total")) : undefined,
  };
}

function resolveImageUrl(rawValue: unknown): string {
  const value = String(rawValue ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;

  try {
    const apiBase = new URL(getApiBaseUrl());
    const origin = `${apiBase.protocol}//${apiBase.host}`;
    if (value.startsWith("/")) return `${origin}${value}`;
    return `${origin}/${value}`;
  } catch {
    return value;
  }
}

export const monthOptions = [
  { label: "Janeiro", value: 1 },
  { label: "Fevereiro", value: 2 },
  { label: "Marco", value: 3 },
  { label: "Abril", value: 4 },
  { label: "Maio", value: 5 },
  { label: "Junho", value: 6 },
  { label: "Julho", value: 7 },
  { label: "Agosto", value: 8 },
  { label: "Setembro", value: 9 },
  { label: "Outubro", value: 10 },
  { label: "Novembro", value: 11 },
  { label: "Dezembro", value: 12 },
];

export type ConsumoPeriodos = {
  anos: number[];
  mesesPorAno: Record<number, number[]>;
};

export async function getConsumoPeriodos(): Promise<ConsumoPeriodos> {
  try {
    const { data } = await apiClient.get("/consumption/consumption");
    const list = (Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []) as Array<{
      dataFim?: string;
      DataFim?: string;
    }>;
    const mesesPorAno: Record<number, number[]> = {};

    for (const item of list) {
      const rawDate = item.dataFim ?? item.DataFim;
      if (!rawDate) continue;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) continue;
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      if (year < 2020) continue;
      if (!mesesPorAno[year]) mesesPorAno[year] = [];
      if (!mesesPorAno[year].includes(month)) mesesPorAno[year].push(month);
    }

    const anos = Object.keys(mesesPorAno)
      .map(Number)
      .sort((a, b) => b - a);

    for (const ano of anos) {
      mesesPorAno[ano].sort((a, b) => b - a);
    }

    return { anos, mesesPorAno };
  } catch (error) {
    throw new Error(normalizeApiError(error));
  }
}

export async function getUnidades(emailCpf: string): Promise<UnidadeOption[]> {
  const parseUnitList = (data: any): UnidadeOption[] => {
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return list.map((item: any) => {
      const nomeCondominio =
        item?.nomeCondominio ?? item?.NomeCondominio ?? item?.condominio ?? item?.Condominio ?? "";
      const nomeAgrupamento =
        item?.nomeAgrupamento ?? item?.NomeAgrupamento ?? item?.agrupamento ?? item?.Agrupamento ?? "";
      const nomeUnidade =
        item?.nome ?? item?.Nome ?? item?.unidade ?? item?.Unidade ?? item?.numero ?? item?.Numero ?? "";
      return {
        label: `${nomeCondominio}: ${nomeAgrupamento} - ${nomeUnidade}`,
        value: Number(item?.id ?? item?.Id),
      };
    });
  };

  try {
    const { data } = await apiClient.get("/Unit/condomino/disponiveis", {
      params: { emailCpf },
    });
    return parseUnitList(data);
  } catch (error) {
    // One retry for transient network failures/timeouts.
    try {
      const { data } = await apiClient.get("/Unit/condomino/disponiveis", {
        params: { emailCpf },
      });
      return parseUnitList(data);
    } catch (retryError) {
      throw new Error(normalizeApiError(retryError));
    }
  }
}

async function getAllTax() {
  const { data } = await apiClient.get("/tableTax/tax");
  return [...(data?.data ?? [])].sort(
    (a: any, b: any) =>
      new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime(),
  );
}

async function getTaxId(mes: number, ano: number) {
  const taxes = await getAllTax();
  if (!taxes.length) return null;
  const selected = new Date(ano, mes - 1, 1);
  const match = taxes.find((e: any) => new Date(e.dataCriacao).getTime() <= selected.getTime());
  const parsed = Number(match?.id ?? taxes[0]?.id);
  return Number.isFinite(parsed) ? parsed : null;
}

async function getFaixaImpostos(idTabela: number): Promise<FaixaImposto[]> {
  const { data } = await apiClient.get(`/taxRanges/tableTax/${idTabela}`);
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return list.map(normalizeFaixaImpostoFromApi);
}

function normalizeUnidade(raw: any, faixaImposto: FaixaImposto[]): Unidade {
  const historicoRaw = pick<any[]>(raw, "historico", "Historico", "historicos", "Historicos") ?? [];
  const faixaEqRaw =
    pick<any[]>(raw, "faixasEnquadramento", "FaixasEnquadramento", "faixaEnquadramento", "FaixaEnquadramento") ?? [];

  return {
    idUnidade: Number(pick(raw, "idUnidade", "IdUnidade", "id", "Id") ?? 0),
    consumo: Number(pick(raw, "consumo", "Consumo") ?? 0),
    diaLeitura: Number(pick(raw, "diaLeitura", "DiaLeitura") ?? 0),
    mesLeitura: Number(pick(raw, "mesLeitura", "MesLeitura") ?? 0),
    anoLeitura: Number(pick(raw, "anoLeitura", "AnoLeitura") ?? 0),
    leituraAtual: Number(pick(raw, "leituraAtual", "LeituraAtual") ?? 0),
    leituraAnterior: Number(pick(raw, "leituraAnterior", "LeituraAnterior") ?? 0),
    urlImagem: resolveImageUrl(
      pick(
        raw,
        "urlImagem",
        "UrlImagem",
        "urlImage",
        "UrlImage",
        "imagem",
        "Imagem",
        "foto",
        "Foto",
      ),
    ),
    hidrometro: String(pick(raw, "hidrometro", "Hidrometro") ?? ""),
    unidade: String(pick(raw, "unidade", "Unidade") ?? ""),
    nomeUnidade: String(pick(raw, "nomeUnidade", "NomeUnidade") ?? ""),
    nomeCondomino: String(pick(raw, "nomeCondomino", "NomeCondomino") ?? ""),
    nomeCondominio: String(pick(raw, "nomeCondominio", "NomeCondominio") ?? ""),
    nomeAgrupamento: String(pick(raw, "nomeAgrupamento", "NomeAgrupamento") ?? ""),
    taxaMinima: Number(pick(raw, "taxaMinima", "TaxaMinima") ?? 0),
    valorPagar: Number(pick(raw, "valorPagar", "ValorPagar") ?? 0),
    valorAreaComum: Number(pick(raw, "valorAreaComum", "ValorAreaComum") ?? 0),
    usaPadraoCaesb: Boolean(pick(raw, "usaPadraoCaesb", "UsaPadraoCaesb") ?? false),
    dataLeitura: String(pick(raw, "dataLeitura", "DataLeitura") ?? ""),
    dataProximaLeitura: String(pick(raw, "dataProximaLeitura", "DataProximaLeitura") ?? ""),
    dataLeituraAnterior: String(pick(raw, "dataLeituraAnterior", "DataLeituraAnterior") ?? ""),
    historico: historicoRaw.map((h: any) => ({
      mesLeitura: Number(pick(h, "mesLeitura", "MesLeitura") ?? 0),
      anoLeitura: Number(pick(h, "anoLeitura", "AnoLeitura") ?? 0),
      consumoDoMes: Number(pick(h, "consumoDoMes", "ConsumoDoMes") ?? 0),
      dataLeitura: String(pick(h, "dataLeitura", "DataLeitura") ?? "").trim() || undefined,
    })),
    faixasEnquadramento: faixaEqRaw.map((f: any) => ({
      ordemFaixa: Number(pick(f, "ordemFaixa", "OrdemFaixa") ?? 0),
      minimo: Number(pick(f, "minimo", "Minimo") ?? 0),
      maximo: Number(pick(f, "maximo", "Maximo") ?? 0),
      enquadramento: Number(pick(f, "enquadramento", "Enquadramento") ?? 0),
      aliquotaAgua: Number(pick(f, "aliquotaAgua", "AliquotaAgua") ?? 0),
      aliquotaEsgoto: Number(pick(f, "aliquotaEsgoto", "AliquotaEsgoto") ?? 0),
      totalFaixa: Number(pick(f, "totalFaixa", "TotalFaixa") ?? 0),
    })),
    faixaImposto,
  };
}

export async function getUnidade(idUnidade: number, mes: number, ano: number): Promise<Unidade> {
  try {
    let idTabela: number | null = null;
    try {
      // Same approach as hidrus-frontend-contas: resolve tax table by unit + year + month context.
      const ctx = await apiClient.get(`/consumption/context/unidade/${idUnidade}`, {
        params: { ano, mes },
      });
      const ctxId = Number(ctx?.data?.idTabelaImposto);
      if (Number.isFinite(ctxId)) idTabela = ctxId;
    } catch {
      // Fallback handled below using tax list by date.
    }

    if (!idTabela) {
      idTabela = await getTaxId(mes, ano);
    }
    if (!idTabela) {
      throw new Error("Período sem tabela de impostos configurada.");
    }

    const dataSelecionada = new Date(ano, mes - 1, 1).toISOString();
    const { data } = await apiClient.get(
      `/reports/bill/unidade/${idUnidade}?idTabela=${idTabela}&dataSelecionada=${dataSelecionada}`,
    );
    const faixaImposto = await getFaixaImpostos(idTabela);
    const raw = data?.data ?? data;
    return normalizeUnidade(raw, faixaImposto);
  } catch (error) {
    throw new Error(normalizeApiError(error));
  }
}
