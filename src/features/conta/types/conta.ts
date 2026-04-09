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
};
