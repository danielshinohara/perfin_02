import { variacaoNoPeriodo } from '../cambio'
import { primeiroDia, ultimoDia } from '../datas'
import { formatarMesAno, formatarPercentual } from '../formatos'
import { acumuladoEntre, ultimoMesDisponivel } from '../inflacao'
import { cdiAcumulado } from '../juros'
import { NOMES_INDICADORES } from '../nomes'
import type { Dec } from '../numeros'
import type { CodigoIndicador, Mes, Ponto } from '../tipos'
import { informativo, type AvaliadorRegra, type ContextoInsights } from './contexto'

const RANQUEAVEIS: CodigoIndicador[] = ['IPCA', 'IGPM', 'INPC', 'CDI', 'USD', 'EUR', 'IBCBR']
const INDICES_MENSAIS: CodigoIndicador[] = ['IPCA', 'IGPM', 'INPC']
const NIVEIS: CodigoIndicador[] = ['USD', 'EUR', 'IBCBR']
const QUANTIDADE_RANKING = 3

function variacaoDoIndicador(codigo: CodigoIndicador, serie: Ponto[], inicio: Mes, ctx: ContextoInsights): Dec | null {
  if (INDICES_MENSAIS.includes(codigo)) {
    const fim = ultimoMesDisponivel(serie, ctx.filtros.fim)
    return fim && fim >= inicio ? acumuladoEntre(serie, inicio, fim) : null
  }
  if (codigo === 'CDI') return cdiAcumulado(serie, primeiroDia(inicio), ctx.referencia)
  if (NIVEIS.includes(codigo)) return variacaoNoPeriodo(serie, primeiroDia(inicio), ctx.referencia)
  return null
}

/** Ranking dos indicadores que mais variaram (em módulo) no período filtrado. */
export const maioresVariacoes: AvaliadorRegra = (ctx, regra) => {
  const { inicio, fim } = ctx.filtros
  const variacoes = ctx.filtros.indicadores
    .filter((codigo) => RANQUEAVEIS.includes(codigo))
    .map((codigo) => ({ codigo, valor: variacaoDoIndicador(codigo, ctx.dados.series[codigo] ?? [], inicio, ctx) }))
    .filter((v): v is { codigo: CodigoIndicador; valor: Dec } => v.valor !== null)
    .sort((a, b) => b.valor.abs().comparedTo(a.valor.abs()))
    .slice(0, QUANTIDADE_RANKING)
  if (variacoes.length === 0) return null
  const lista = variacoes.map((v) => `${NOMES_INDICADORES[v.codigo]} ${formatarPercentual(v.valor, 2, true)}`).join(', ')
  return informativo(regra, {
    titulo: 'Maiores variações no período',
    texto: `De ${formatarMesAno(inicio)} a ${formatarMesAno(fim)}: ${lista}.`,
    indicadores: variacoes.map((v) => v.codigo),
    dataReferencia: ultimoDia(fim) < ctx.referencia ? ultimoDia(fim) : ctx.referencia,
  })
}
