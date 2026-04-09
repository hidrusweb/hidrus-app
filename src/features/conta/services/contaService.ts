import { apiClient, normalizeApiError } from "../../../core/api/client";
import { getApiBaseUrl } from "../../../core/config/env";
import type {
  ContaResumoPage,
  ContaResumoItem,
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

export type PeriodoContaUnidade = {
  ano: number;
  mes: number;
  periodoFim: string;
};

/** Ano/mês em que a unidade tem leitura e existe consumo ativo (conta pode ser gerada). */
export async function getPeriodosContaPorUnidade(idUnidade: number): Promise<PeriodoContaUnidade[]> {
  try {
    const { data } = await apiClient.get(`/mensuration/unidade/${idUnidade}/periodos-disponiveis`);
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return list
      .map((row: any) => {
        const ano = Number(row.ano ?? row.Ano ?? 0);
        const mes = Number(row.mes ?? row.Mes ?? 0);
        let periodoFim = String(row.periodoFim ?? row.PeriodoFim ?? "").trim();
        if (!periodoFim && ano > 0 && mes >= 1 && mes <= 12) {
          periodoFim = `${ano}-${String(mes).padStart(2, "0")}-28`;
        }
        return { ano, mes, periodoFim };
      })
      .filter((p: PeriodoContaUnidade) => p.ano > 0 && p.mes >= 1 && p.mes <= 12);
  } catch (error) {
    throw new Error(normalizeApiError(error));
  }
}

/** Uma chamada paginada já com resumo (leitura, consumo e total) para render da lista. */
export async function getResumoContasPorUnidade(
  unidade: UnidadeOption,
  page = 1,
  perPage = 10,
): Promise<ContaResumoPage> {
  try {
    const { data } = await apiClient.get(`/mensuration/unidade/${unidade.value}/periodos-conta`, {
      params: { page, perPage },
    });
    const rows = Array.isArray(data?.data) ? data.data : [];
    const items: ContaResumoItem[] = rows.map((row: any) => ({
      idUnidade: Number(row.idUnidade ?? unidade.value),
      ano: Number(row.ano ?? 0),
      mes: Number(row.mes ?? 0),
      periodoFim: String(row.periodoFim ?? "").trim(),
      dataLeitura: row.dataLeitura ?? row.DataLeitura ?? null,
      leituraAnterior: Number(row.leituraAnterior ?? row.LeituraAnterior ?? 0),
      leituraAtual: Number(row.leituraAtual ?? row.LeituraAtual ?? 0),
      consumo: Number(row.consumo ?? row.Consumo ?? 0),
      valorTotal: Number(row.valorTotal ?? row.ValorTotal ?? 0),
      nomeCondominio: unidade.nomeCondominio,
      rotuloUnidade: `${unidade.nomeAgrupamento} — ${unidade.nomeUnidade}`.trim(),
    }));
    const meta = data?.meta ?? {};
    return {
      items,
      page: Number(meta.page ?? page),
      perPage: Number(meta.perPage ?? perPage),
      hasMore: Boolean(meta.hasMore),
    };
  } catch (error) {
    throw new Error(normalizeApiError(error));
  }
}

const unidadeBillCache = new Map<string, Promise<Unidade>>();

/** Evita N chamadas idênticas a /consumption/context para o mesmo (unidade, mês, ano). */
const consumptionContextCache = new Map<string, Promise<number | null>>();

/** Evita repetir /taxRanges/tableTax/{id} quando vários meses usam a mesma tabela. */
const faixaImpostoCache = new Map<number, Promise<FaixaImposto[]>>();

/** Uma única chamada a /tableTax/tax por sessão (getTaxId usa isto). */
let allTaxListPromise: Promise<any[]> | null = null;

export function getUnidadeBillCached(idUnidade: number, mes: number, ano: number): Promise<Unidade> {
  const k = `${idUnidade}-${mes}-${ano}`;
  let p = unidadeBillCache.get(k);
  if (!p) {
    p = getUnidade(idUnidade, mes, ano);
    unidadeBillCache.set(k, p);
  }
  return p;
}

export function clearContaApiCaches() {
  unidadeBillCache.clear();
  consumptionContextCache.clear();
  faixaImpostoCache.clear();
  allTaxListPromise = null;
}

/** @deprecated use clearContaApiCaches */
export function clearUnidadeBillCache() {
  clearContaApiCaches();
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
      const idCondominio = Number(item?.idCondominio ?? item?.IdCondominio ?? 0);
      return {
        label: `${nomeCondominio}: ${nomeAgrupamento} - ${nomeUnidade}`,
        value: Number(item?.id ?? item?.Id),
        idCondominio,
        nomeCondominio: String(nomeCondominio),
        nomeAgrupamento: String(nomeAgrupamento),
        nomeUnidade: String(nomeUnidade),
      };
    });
  };

  try {
    console.log('fetching unidades');
    
    const { data } = await apiClient.get("/Unit/condomino/disponiveis", {
      params: { emailCpf },
    });
    console.log('unidades fetched', data);
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

async function getAllTaxCached() {
  if (!allTaxListPromise) {
    allTaxListPromise = getAllTax();
  }
  return allTaxListPromise;
}

async function getTaxId(mes: number, ano: number) {
  const taxes = await getAllTaxCached();
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

async function getFaixaImpostosCached(idTabela: number): Promise<FaixaImposto[]> {
  let p = faixaImpostoCache.get(idTabela);
  if (!p) {
    p = getFaixaImpostos(idTabela);
    faixaImpostoCache.set(idTabela, p);
  }
  return p;
}

function getCachedConsumptionContext(idUnidade: number, mes: number, ano: number): Promise<number | null> {
  const k = `${idUnidade}|${ano}|${mes}`;
  let p = consumptionContextCache.get(k);
  if (!p) {
    p = (async () => {
      try {
        const ctx = await apiClient.get(`/consumption/context/unidade/${idUnidade}`, {
          params: { ano, mes },
        });
        const ctxId = Number(ctx?.data?.idTabelaImposto);
        return Number.isFinite(ctxId) ? ctxId : null;
      } catch {
        return null;
      }
    })();
    consumptionContextCache.set(k, p);
  }
  return p;
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
    let idTabela: number | null = await getCachedConsumptionContext(idUnidade, mes, ano);

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
    const faixaImposto = await getFaixaImpostosCached(idTabela);
    const raw = data?.data ?? data;
    return normalizeUnidade(raw, faixaImposto);
  } catch (error) {
    throw new Error(normalizeApiError(error));
  }
}
