import { listarMeses, somarMeses } from './datas'
import { indexarMensal } from './inflacao'
import { CEM, Dec, media, UM, variacaoPercentual } from './numeros'
import type { DataISO, Mes, Ponto } from './tipos'

function mediaDosMeses(indice: Map<Mes, Dec>, inicio: Mes, fim: Mes): Dec | null {
  const valores: Dec[] = []
  for (const mes of listarMeses(inicio, fim)) {
    const valor = indice.get(mes)
    if (!valor) return null
    valores.push(valor)
  }
  return media(valores)
}

/** Crescimento em 12 meses de um índice de nível: média dos 12 meses / média dos 12 anteriores − 1. */
export function crescimento12m(serie: Ponto[], mes: Mes): Dec | null {
  const indice = indexarMensal(serie)
  const atual = mediaDosMeses(indice, somarMeses(mes, -11), mes)
  const anterior = mediaDosMeses(indice, somarMeses(mes, -23), somarMeses(mes, -12))
  return atual && anterior ? atual.div(anterior).minus(UM).times(CEM) : null
}

function valorNaData(serie: Ponto[], data: DataISO): Dec | null {
  const ponto = serie.find((p) => p.data === data)
  return ponto ? new Dec(ponto.valor) : null
}

/** Variação contra o mesmo trimestre do ano anterior. */
export function variacaoInteranual(serie: Ponto[], data: DataISO): Dec | null {
  const atual = valorNaData(serie, data)
  const anterior = valorNaData(serie, `${somarMeses(data.slice(0, 7), -12)}-01`)
  return atual && anterior ? variacaoPercentual(anterior, atual) : null
}
