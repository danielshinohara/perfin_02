import { inicioDaSemana } from './datas'
import { acumuladoNoAno, ultimoMesDisponivel } from './inflacao'
import { CEM, Dec, UM } from './numeros'
import type { DataISO, Expectativa, IndicadorFocus, Ponto } from './tipos'

/** Mediana mais recente de cada semana (as coletas do Focus são diárias). */
export function serieSemanal(
  expectativas: Expectativa[],
  indicador: IndicadorFocus,
  referencia: string,
): Ponto[] {
  const porSemana = new Map<DataISO, Expectativa>()
  for (const e of expectativas) {
    if (e.indicador !== indicador || e.referencia !== referencia) continue
    const semana = inicioDaSemana(e.dataColeta)
    const atual = porSemana.get(semana)
    if (!atual || e.dataColeta > atual.dataColeta) porSemana.set(semana, e)
  }
  return [...porSemana.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semana, e]) => ({ data: semana, valor: e.mediana }))
}

export function ultimaExpectativa(
  expectativas: Expectativa[],
  indicador: IndicadorFocus,
  referencia: string,
  ateData: DataISO,
): Expectativa | null {
  let ultima: Expectativa | null = null
  for (const e of expectativas) {
    if (e.indicador !== indicador || e.referencia !== referencia || e.dataColeta > ateData) continue
    if (!ultima || e.dataColeta > ultima.dataColeta) ultima = e
  }
  return ultima
}

export type DirecaoRevisao = 'alta' | 'queda' | 'estavel'

export interface Revisoes {
  direcao: DirecaoRevisao
  semanas: number
}

/** Quantas semanas seguidas (até a última) a mediana subiu ou caiu. */
export function revisoesSeguidas(semanal: Ponto[]): Revisoes {
  let direcao: DirecaoRevisao = 'estavel'
  let semanas = 0
  for (let i = semanal.length - 1; i > 0; i--) {
    const diferenca = new Dec(semanal[i].valor).minus(semanal[i - 1].valor)
    const atual: DirecaoRevisao = diferenca.gt(0) ? 'alta' : diferenca.lt(0) ? 'queda' : 'estavel'
    if (atual === 'estavel' || (direcao !== 'estavel' && atual !== direcao)) break
    direcao = atual
    semanas++
  }
  return { direcao, semanas }
}

/** Inflação implícita no restante do ano: (1 + esperado no ano)/(1 + acumulado no ano) − 1. */
export function inflacaoImplicitaRestante(esperadoAno: Dec, acumuladoAno: Dec): Dec {
  return UM.plus(esperadoAno.div(CEM)).div(UM.plus(acumuladoAno.div(CEM))).minus(UM).times(CEM)
}

export interface InflacaoDoAno {
  ano: number
  esperado: Dec
  dataColeta: DataISO
  acumulado: Dec
  /** Último mês com IPCA divulgado (`AAAA-MM`). */
  mesAcumulado: string
  restante: Dec
}

/** Esperado pelo Focus para o ano × IPCA já acumulado × o que falta (implícito). */
export function inflacaoDoAno(expectativas: Expectativa[], ipca: Ponto[], referencia: DataISO): InflacaoDoAno | null {
  const ano = Number(referencia.slice(0, 4))
  const esperado = ultimaExpectativa(expectativas, 'IPCA', String(ano), referencia)
  const mes = ultimoMesDisponivel(ipca, referencia.slice(0, 7))
  const acumulado = mes && mes.startsWith(String(ano)) ? acumuladoNoAno(ipca, mes) : null
  if (!esperado || !mes || !acumulado) return null
  const valorEsperado = new Dec(esperado.mediana)
  return {
    ano,
    esperado: valorEsperado,
    dataColeta: esperado.dataColeta,
    acumulado,
    mesAcumulado: mes,
    restante: inflacaoImplicitaRestante(valorEsperado, acumulado),
  }
}
