export type Historico = {
  mesLeitura: number;
  anoLeitura: number;
  consumoDoMes: number;
  /** ISO `yyyy-mm-dd` quando a API envia (ex.: DataLeitura do legado). */
  dataLeitura?: string;
};

export type FaixaImposto = {
  id: number;
  idTabelaImposto: number;
  minimo: number;
  maximo: number;
  tipoFaixa: number;
  ordenacao: number;
  nomeFaixa: string;
  nomeTabela: string;
  aliquotaAgua: number;
  aliquotaEsgoto: number;
  total?: number;
};

export type FaixaEnquadramento = {
  ordemFaixa: number;
  minimo: number;
  maximo: number;
  enquadramento: number;
  aliquotaAgua: number;
  aliquotaEsgoto: number;
  totalFaixa: number;
};

export type Unidade = {
  idUnidade: number;
  consumo: number;
  diaLeitura: number;
  mesLeitura: number;
  anoLeitura: number;
  leituraAtual: number;
  leituraAnterior: number;
  urlImagem: string;
  hidrometro: string;
  unidade: string;
  nomeUnidade: string;
  nomeCondomino: string;
  nomeCondominio: string;
  nomeAgrupamento: string;
  taxaMinima: number;
  valorPagar: number;
  valorAreaComum: number;
  usaPadraoCaesb: boolean;
  dataLeitura: string;
  dataProximaLeitura?: string | null;
  dataLeituraAnterior: string;
  historico: Historico[];
  faixasEnquadramento: FaixaEnquadramento[];
  faixaImposto?: FaixaImposto[];
};

export type UnidadeOption = {
  label: string;
  value: number;
  idCondominio: number;
  nomeCondominio: string;
  nomeAgrupamento: string;
  nomeUnidade: string;
};

/** Uma linha na lista de contas (unidade + período de faturamento). */
export type ContaListaChave = {
  idUnidade: number;
  mes: number;
  ano: number;
  idCondominio: number;
  nomeCondominio: string;
  /** Data fim do ciclo (TB_CONSUMO) para ordenar do mais novo ao mais antigo. */
  periodoFim: string;
  rotuloUnidade: string;
};

export type ContaResumoItem = {
  idUnidade: number;
  mes: number;
  ano: number;
  periodoFim: string;
  dataLeitura?: string | null;
  leituraAnterior: number;
  leituraAtual: number;
  consumo: number;
  valorTotal: number;
  nomeCondominio: string;
  rotuloUnidade: string;
};

export type ContaResumoPage = {
  items: ContaResumoItem[];
  page: number;
  perPage: number;
  hasMore: boolean;
};
