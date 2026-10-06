import { crescimento12m } from './atividade'
import { variacaoNoMes } from './cambio'
import { mesDe, mesmoDiaAnoAnterior, somarDias, ultimoPontoAte } from './datas'
import { ultimaExpectativa } from './expectativas'
import { formatarMoeda, formatarPercentual, formatarPontos } from './formatos'
import { acumulado12m, faixaDaMeta, situacaoNaMeta, ultimoMesDisponivel, type SituacaoMeta } from './inflacao'
import { cdiAcumulado, valorVigente } from './juros'
import { Dec, taxaReal } from './numeros'
import type { DadosAnalise, DataISO, Mes, Ponto } from './tipos'

export type UnidadeKpi = 'percentual' | 'moeda' | 'pontos'

export interface Kpi {
  id: string
  titulo: string
  valor: Dec | null
  unidade: UnidadeKpi
  /** Data (ou 1º dia do mês) a que o valor se refere. */
  referencia: DataISO | null
  complemento: string | null
  variacao: { valor: Dec; rotulo: string } | null
  situacaoMeta?: SituacaoMeta
}

/** Valor do KPI formatado em pt-BR (ou travessão quando não há dado). */
export function formatarValorKpi(kpi: Kpi): string {
  if (!kpi.valor) return '—'
  if (kpi.unidade === 'moeda') return formatarMoeda(kpi.valor, 4)
  if (kpi.unidade === 'pontos') return formatarPontos(kpi.valor)
  return formatarPercentual(kpi.valor)
}

export function kpiInflacao12m(id: string, titulo: string, serie: Ponto[], dados: DadosAnalise, ref: DataISO): Kpi {
  const mes = ultimoMesDisponivel(serie, mesDe(ref))
  const valor = mes ? acumulado12m(serie, mes) : null
  const faixa = mes ? faixaDaMeta(dados.metas, Number(mes.slice(0, 4))) : null
  const comMeta = id === 'IPCA_12M' && faixa && valor
  return {
    id,
    titulo,
    valor,
    unidade: 'percentual',
    referencia: mes ? `${mes}-01` : null,
    complemento: comMeta
      ? `Meta ${formatarPercentual(faixa.centro)} (${formatarPercentual(faixa.piso)} a ${formatarPercentual(faixa.teto)})`
      : null,
    variacao: null,
    situacaoMeta: comMeta ? situacaoNaMeta(valor, faixa) : undefined,
  }
}

export function kpiSelic(dados: DadosAnalise, ref: DataISO): Kpi {
  const serie = dados.series.SELIC_META ?? []
  return {
    id: 'SELIC',
    titulo: 'Meta Selic',
    valor: valorVigente(serie, ref),
    unidade: 'percentual',
    referencia: ultimoPontoAte(serie, ref)?.data ?? null,
    complemento: 'ao ano',
    variacao: null,
  }
}

export function kpiCdi12m(dados: DadosAnalise, ref: DataISO): Kpi {
  const serie = dados.series.CDI ?? []
  return {
    id: 'CDI_12M',
    titulo: 'CDI em 12 meses',
    valor: cdiAcumulado(serie, somarDias(mesmoDiaAnoAnterior(ref), 1), ref),
    unidade: 'percentual',
    referencia: ultimoPontoAte(serie, ref)?.data ?? null,
    complemento: null,
    variacao: null,
  }
}

/** Juro real ex-ante: meta Selic descontada do IPCA esperado (Focus) para os próximos 12 meses. */
export function jurosRealExAnte(dados: DadosAnalise, ref: DataISO): Dec | null {
  const selic = valorVigente(dados.series.SELIC_META ?? [], ref)
  const esperado = ultimaExpectativa(dados.expectativas, 'IPCA', '12M', ref)
  return selic && esperado ? taxaReal(selic, new Dec(esperado.mediana)) : null
}

export function kpiJuroReal(dados: DadosAnalise, ref: DataISO): Kpi {
  return {
    id: 'JURO_REAL',
    titulo: 'Juro real ex-ante',
    valor: jurosRealExAnte(dados, ref),
    unidade: 'percentual',
    referencia: ultimaExpectativa(dados.expectativas, 'IPCA', '12M', ref)?.dataColeta ?? null,
    complemento: 'Selic ÷ IPCA esperado 12m (Focus)',
    variacao: null,
  }
}

export function kpiCambio(id: string, titulo: string, serie: Ponto[], ref: DataISO): Kpi {
  const ultimo = ultimoPontoAte(serie, ref)
  const variacao = ultimo ? variacaoNoMes(serie, mesDe(ultimo.data)) : null
  return {
    id,
    titulo,
    valor: ultimo ? new Dec(ultimo.valor) : null,
    unidade: 'moeda',
    referencia: ultimo?.data ?? null,
    complemento: 'PTAX venda',
    variacao: variacao ? { valor: variacao, rotulo: 'no mês' } : null,
  }
}

export function kpiIbcBr(dados: DadosAnalise, ref: DataISO): Kpi {
  const serie = dados.series.IBCBR ?? []
  const mes: Mes | null = ultimoMesDisponivel(serie, mesDe(ref))
  return {
    id: 'IBCBR_12M',
    titulo: 'IBC-Br em 12 meses',
    valor: mes ? crescimento12m(serie, mes) : null,
    unidade: 'percentual',
    referencia: mes ? `${mes}-01` : null,
    complemento: 'prévia do PIB',
    variacao: null,
  }
}

/** Cartões da Visão geral. Com `apenasPublicos`, só os indicadores exibidos no site. */
export function kpisTermometro(dados: DadosAnalise, ref: DataISO, apenasPublicos = false): Kpi[] {
  const s = dados.series
  const publicos = [
    kpiInflacao12m('IPCA_12M', 'IPCA em 12 meses', s.IPCA ?? [], dados, ref),
    kpiSelic(dados, ref),
    kpiCdi12m(dados, ref),
    kpiCambio('USD', 'Dólar', s.USD ?? [], ref),
    kpiInflacao12m('IGPM_12M', 'IGP-M em 12 meses', s.IGPM ?? [], dados, ref),
  ]
  if (apenasPublicos) return publicos
  return [...publicos.slice(0, 3), kpiJuroReal(dados, ref), ...publicos.slice(3), kpiIbcBr(dados, ref)]
}
