import { listarMeses, mesDe, mesmoDiaAnoAnterior, pontosEntre, primeiroDia, somarDias, somarMeses, ultimoDia, ultimoPontoAte } from './datas'
import { desvioPadrao, Dec, media, variacaoPercentual } from './numeros'
import type { DataISO, Mes, Ponto } from './tipos'

const DIAS_UTEIS_ANO = 252
export const JANELA_VOLATILIDADE = 21

/** Variação entre a última cotação antes de `inicio` e a última até `fim`. */
export function variacaoNoPeriodo(serie: Ponto[], inicio: DataISO, fim: DataISO): Dec | null {
  const base = ultimoPontoAte(serie, somarDias(inicio, -1))
  const final = ultimoPontoAte(serie, fim)
  if (!base || !final || final.data < inicio) return null
  return variacaoPercentual(new Dec(base.valor), new Dec(final.valor))
}

export function variacaoNoMes(serie: Ponto[], mes: Mes): Dec | null {
  return variacaoNoPeriodo(serie, primeiroDia(mes), ultimoDia(mes))
}

export function variacaoNoAno(serie: Ponto[], data: DataISO): Dec | null {
  return variacaoNoPeriodo(serie, `${data.slice(0, 4)}-01-01`, data)
}

/** Variação entre a cotação de um ano antes (última até aquela data) e a última até `data`. */
export function variacao12m(serie: Ponto[], data: DataISO): Dec | null {
  return variacaoNoPeriodo(serie, somarDias(mesmoDiaAnoAnterior(data), 1), data)
}

export interface EstatisticasPeriodo {
  media: Dec
  maxima: Ponto
  minima: Ponto
}

export function estatisticasPeriodo(serie: Ponto[], inicio: DataISO, fim: DataISO): EstatisticasPeriodo | null {
  const pontos = pontosEntre(serie, inicio, fim)
  if (pontos.length === 0) return null
  let maxima = pontos[0]
  let minima = pontos[0]
  for (const p of pontos) {
    if (new Dec(p.valor).gt(maxima.valor)) maxima = p
    if (new Dec(p.valor).lt(minima.valor)) minima = p
  }
  return { media: media(pontos.map((p) => new Dec(p.valor))), maxima, minima }
}

/**
 * Volatilidade anualizada (%): desvio-padrão dos retornos diários ln(Pₜ/Pₜ₋₁)
 * nos últimos `janela` dias úteis até `data`, multiplicado por √252.
 */
export function volatilidade(serie: Ponto[], data: DataISO, janela = JANELA_VOLATILIDADE): Dec | null {
  const ate = serie.filter((p) => p.data <= data)
  if (ate.length < janela + 1) return null
  const precos = ate.slice(-(janela + 1)).map((p) => new Dec(p.valor))
  const retornos = precos.slice(1).map((p, i) => p.div(precos[i]).ln())
  return desvioPadrao(retornos).times(new Dec(DIAS_UTEIS_ANO).sqrt()).times(100)
}

/** Média da volatilidade medida no fim de cada um dos 12 meses anteriores ao mês de `data`. */
export function volatilidadeMedia12m(serie: Ponto[], data: DataISO): Dec | null {
  const mesAtual = mesDe(data)
  const valores = listarMeses(somarMeses(mesAtual, -12), somarMeses(mesAtual, -1))
    .map((mes) => volatilidade(serie, ultimoDia(mes)))
    .filter((v): v is Dec => v !== null)
  return valores.length > 0 ? media(valores) : null
}

/**
 * Último mês anterior a `mes` em que a variação foi pelo menos tão grande (na mesma direção).
 * Retorna null se nunca houve (é a maior da série disponível).
 */
export function ultimoMesComVariacaoMaior(serie: Ponto[], mes: Mes, primeiroMes: Mes): Mes | null {
  const referencia = variacaoNoMes(serie, mes)
  if (!referencia) return null
  for (let atual = somarMeses(mes, -1); atual >= primeiroMes; atual = somarMeses(atual, -1)) {
    const v = variacaoNoMes(serie, atual)
    if (!v) continue
    if (referencia.gte(0) ? v.gte(referencia) : v.lte(referencia)) return atual
  }
  return null
}
