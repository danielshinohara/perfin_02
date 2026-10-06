import { formatarMoeda, formatarNumero } from '../formatos'
import type { UnidadeGrafico } from './tipos'

/** Formata um valor de gráfico ou tabela conforme a unidade. */
export function formatarValorGrafico(valor: number, unidade: UnidadeGrafico): string {
  if (unidade === 'moeda') return formatarMoeda(valor, 4)
  if (unidade === 'percentual') return `${formatarNumero(valor, 2)}%`
  if (unidade === 'pontos') return `${formatarNumero(valor, 2)} p.p.`
  return formatarNumero(valor, 2)
}
