import { anoDe, listarMeses, mesDe, primeiroDia, somarMeses } from './datas'
import { CEM, comporPercentuais, Dec, UM } from './numeros'
import type { MetaInflacao, Mes, Ponto } from './tipos'

/** Índice das séries mensais por mês (`AAAA-MM` -> valor). */
export function indexarMensal(serie: Ponto[]): Map<Mes, Dec> {
  return new Map(serie.map((p) => [mesDe(p.data), new Dec(p.valor)]))
}

export function valorDoMes(serie: Ponto[], mes: Mes): Dec | null {
  const ponto = serie.find((p) => p.data === primeiroDia(mes))
  return ponto ? new Dec(ponto.valor) : null
}

/** Último mês com dado disponível até `ateMes` (inclusive). */
export function ultimoMesDisponivel(serie: Ponto[], ateMes: Mes): Mes | null {
  for (let i = serie.length - 1; i >= 0; i--) {
    const mes = mesDe(serie[i].data)
    if (mes <= ateMes) return mes
  }
  return null
}

/** Acumulado entre dois meses (inclusive). Retorna null se faltar algum mês. */
export function acumuladoEntre(serie: Ponto[], inicio: Mes, fim: Mes): Dec | null {
  const indice = indexarMensal(serie)
  const valores: Dec[] = []
  for (const mes of listarMeses(inicio, fim)) {
    const valor = indice.get(mes)
    if (!valor) return null
    valores.push(valor)
  }
  return comporPercentuais(valores)
}

export function acumulado12m(serie: Ponto[], mes: Mes): Dec | null {
  return acumuladoEntre(serie, somarMeses(mes, -11), mes)
}

export function acumuladoNoAno(serie: Ponto[], mes: Mes): Dec | null {
  return acumuladoEntre(serie, `${anoDe(mes)}-01`, mes)
}

/** Média dos últimos 3 meses anualizada: (1 + acumulado 3m)^4 − 1. */
export function mediaAnualizada3m(serie: Ponto[], mes: Mes): Dec | null {
  const acumulado3m = acumuladoEntre(serie, somarMeses(mes, -2), mes)
  return acumulado3m ? UM.plus(acumulado3m.div(CEM)).pow(4).minus(UM).times(CEM) : null
}

export interface FaixaMeta {
  centro: Dec
  piso: Dec
  teto: Dec
}

export function faixaDaMeta(metas: MetaInflacao[], ano: number): FaixaMeta | null {
  const meta = metas.find((m) => m.ano === ano)
  if (!meta) return null
  const centro = new Dec(meta.centro)
  const tolerancia = new Dec(meta.tolerancia)
  return { centro, piso: centro.minus(tolerancia), teto: centro.plus(tolerancia) }
}

export type SituacaoMeta = 'abaixo' | 'dentro' | 'acima'

export function situacaoNaMeta(valor12m: Dec, faixa: FaixaMeta): SituacaoMeta {
  if (valor12m.gt(faixa.teto)) return 'acima'
  if (valor12m.lt(faixa.piso)) return 'abaixo'
  return 'dentro'
}

/** Quantos meses seguidos (terminando em `mes`) o acumulado em 12 meses ficou fora da banda. */
export function mesesSeguidosForaDaBanda(serie: Ponto[], metas: MetaInflacao[], mes: Mes): number {
  let contador = 0
  for (let atual = mes; ; atual = somarMeses(atual, -1)) {
    const valor = acumulado12m(serie, atual)
    const faixa = faixaDaMeta(metas, anoDe(atual))
    if (!valor || !faixa || situacaoNaMeta(valor, faixa) === 'dentro') return contador
    contador++
  }
}

/** Diferença IGP-M − IPCA em 12 meses, em pontos percentuais. */
export function spread12m(igpm: Ponto[], ipca: Ponto[], mes: Mes): Dec | null {
  const a = acumulado12m(igpm, mes)
  const b = acumulado12m(ipca, mes)
  return a && b ? a.minus(b) : null
}
