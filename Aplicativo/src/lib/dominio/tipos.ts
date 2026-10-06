/** Data no formato ISO 8601 `AAAA-MM-DD`. */
export type DataISO = string
/** Mês no formato `AAAA-MM`. */
export type Mes = string

export const CODIGOS_INDICADORES = [
  'IPCA',
  'IGPM',
  'INPC',
  'SELIC_META',
  'CDI',
  'USD',
  'EUR',
  'IBCBR',
  'FBCF',
  'FBCF_REAL',
] as const
export type CodigoIndicador = (typeof CODIGOS_INDICADORES)[number]

/** Valor numérico sempre como texto (vindo do `numeric` do Postgres) para não perder precisão. */
export interface Ponto {
  data: DataISO
  valor: string
}

/** Séries ordenadas por data crescente. */
export type Series = Partial<Record<CodigoIndicador, Ponto[]>>

export interface MetaInflacao {
  ano: number
  centro: string
  tolerancia: string
}

export type IndicadorFocus = 'IPCA' | 'SELIC' | 'CAMBIO' | 'PIB'

export interface Expectativa {
  indicador: IndicadorFocus
  /** Ano (`2026`) ou `12M` (próximos 12 meses). */
  referencia: string
  dataColeta: DataISO
  mediana: string
}

export interface DadosAnalise {
  series: Series
  metas: MetaInflacao[]
  expectativas: Expectativa[]
}

export type Severidade = 'informativo' | 'atencao' | 'alerta'

export const CODIGOS_REGRAS = [
  'IPCA_FORA_META',
  'INFLACAO_ACELERANDO',
  'JURO_REAL',
  'SPREAD_IGPM_IPCA',
  'DOLAR_MOVIMENTO',
  'DOLAR_VOLATILIDADE',
  'FOCUS_REVISOES',
  'CDI_REAL',
  'ATIVIDADE_DESACELERA',
  'MAIORES_VARIACOES',
] as const
export type CodigoRegra = (typeof CODIGOS_REGRAS)[number]

export interface RegraAlerta {
  codigo: CodigoRegra
  descricao: string
  limite: string | null
  limiteSecundario: string | null
  severidade: Severidade
  ativa: boolean
}

export interface Insight {
  regra: CodigoRegra
  titulo: string
  texto: string
  severidade: Severidade
  /** Verdadeiro quando a regra passou do limite configurado. */
  ehAlerta: boolean
  indicadores: CodigoIndicador[]
  dataReferencia: DataISO
}
