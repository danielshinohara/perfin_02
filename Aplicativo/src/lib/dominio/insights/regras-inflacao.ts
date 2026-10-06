import { mesDe, primeiroDia, somarMeses } from '../datas'
import { formatarMesAno, formatarNumero, formatarPercentual } from '../formatos'
import {
  acumulado12m,
  faixaDaMeta,
  mediaAnualizada3m,
  mesesSeguidosForaDaBanda,
  situacaoNaMeta,
  spread12m,
  ultimoMesDisponivel,
} from '../inflacao'
import { alerta, informativo, limite, type AvaliadorRegra } from './contexto'

const MESES_DESCUMPRIMENTO = 6
/** Início da meta contínua, regime em que vale a regra dos 6 meses seguidos fora da banda. */
const INICIO_META_CONTINUA = '2025-01'

export const ipcaForaDaMeta: AvaliadorRegra = (ctx, regra) => {
  const ipca = ctx.dados.series.IPCA ?? []
  const mes = ultimoMesDisponivel(ipca, mesDe(ctx.referencia))
  const valor = mes ? acumulado12m(ipca, mes) : null
  const faixa = mes ? faixaDaMeta(ctx.dados.metas, Number(mes.slice(0, 4))) : null
  if (!mes || !valor || !faixa) return null

  const situacao = situacaoNaMeta(valor, faixa)
  const base = { indicadores: ['IPCA' as const], dataReferencia: primeiroDia(mes) }
  if (situacao === 'dentro') {
    return informativo(regra, {
      ...base,
      titulo: 'IPCA dentro da meta',
      texto: `IPCA em 12 meses está em ${formatarPercentual(valor)} (${formatarMesAno(mes)}), dentro da banda de ${formatarPercentual(faixa.piso)} a ${formatarPercentual(faixa.teto)}.`,
    })
  }
  const meses = mesesSeguidosForaDaBanda(ipca, ctx.dados.metas, mes)
  const limiteMeta = situacao === 'acima' ? `acima do teto da meta (${formatarPercentual(faixa.teto)})` : `abaixo do piso da meta (${formatarPercentual(faixa.piso)})`
  const desde = somarMeses(mes, -(MESES_DESCUMPRIMENTO - 1))
  const descumprimento = meses >= MESES_DESCUMPRIMENTO && desde >= INICIO_META_CONTINUA ? ' Pela regra da meta contínua, isso caracteriza descumprimento.' : ''
  return alerta(regra, {
    ...base,
    titulo: situacao === 'acima' ? 'IPCA acima da meta' : 'IPCA abaixo da meta',
    texto: `IPCA em 12 meses está em ${formatarPercentual(valor)}, ${limiteMeta} há ${meses} ${meses === 1 ? 'mês' : 'meses seguidos'}.${descumprimento}`,
  })
}

export const inflacaoAcelerando: AvaliadorRegra = (ctx, regra) => {
  const ipca = ctx.dados.series.IPCA ?? []
  const mes = ultimoMesDisponivel(ipca, mesDe(ctx.referencia))
  const media3m = mes ? mediaAnualizada3m(ipca, mes) : null
  const em12m = mes ? acumulado12m(ipca, mes) : null
  const limitePp = limite(regra)
  if (!mes || !media3m || !em12m || !limitePp) return null

  const diferenca = media3m.minus(em12m)
  const base = { indicadores: ['IPCA' as const], dataReferencia: primeiroDia(mes) }
  const comparacao = `A média dos últimos 3 meses anualizada (${formatarPercentual(media3m)}) está`
  if (diferenca.gte(limitePp)) {
    return alerta(regra, {
      ...base,
      titulo: 'Inflação acelerando',
      texto: `${comparacao} ${formatarNumero(diferenca.abs())} p.p. acima do IPCA em 12 meses (${formatarPercentual(em12m)}).`,
    })
  }
  if (diferenca.lte(limitePp.neg())) {
    return informativo(regra, {
      ...base,
      titulo: 'Inflação desacelerando',
      texto: `${comparacao} ${formatarNumero(diferenca.abs())} p.p. abaixo do IPCA em 12 meses (${formatarPercentual(em12m)}).`,
    })
  }
  return null
}

export const spreadIgpmIpca: AvaliadorRegra = (ctx, regra) => {
  const igpm = ctx.dados.series.IGPM ?? []
  const ipca = ctx.dados.series.IPCA ?? []
  const mesIgpm = ultimoMesDisponivel(igpm, mesDe(ctx.referencia))
  const mesIpca = ultimoMesDisponivel(ipca, mesDe(ctx.referencia))
  const mes = mesIgpm && mesIpca ? (mesIgpm < mesIpca ? mesIgpm : mesIpca) : null
  const spread = mes ? spread12m(igpm, ipca, mes) : null
  const limitePp = limite(regra)
  if (!mes || !spread || !limitePp || spread.abs().lt(limitePp)) return null

  const direcao = spread.gt(0) ? 'acima' : 'abaixo'
  return alerta(regra, {
    titulo: `IGP-M ${direcao} do IPCA`,
    texto: `Contratos corrigidos pelo IGP-M (como aluguéis) acumulam ${formatarNumero(spread.abs())} p.p. ${direcao} do IPCA em 12 meses (${formatarMesAno(mes)}).`,
    indicadores: ['IGPM', 'IPCA'],
    dataReferencia: primeiroDia(mes),
  })
}
