import { crescimento12m } from '../atividade'
import { ultimoMesComVariacaoMaior, variacaoNoMes, volatilidade, volatilidadeMedia12m } from '../cambio'
import { mesDe, primeiroDia, somarMeses, ultimoPontoAte } from '../datas'
import { revisoesSeguidas, serieSemanal, ultimaExpectativa } from '../expectativas'
import { formatarData, formatarMesAno, formatarNumero, formatarPercentual } from '../formatos'
import { acumuladoNoAno, ultimoMesDisponivel } from '../inflacao'
import { cdiAcumulado } from '../juros'
import { taxaReal } from '../numeros'
import { PRIMEIRO_MES_DISPONIVEL } from '../periodo'
import { jurosRealExAnte } from '../resumo'
import { alerta, informativo, limite, limiteSecundario, type AvaliadorRegra } from './contexto'

export const juroReal: AvaliadorRegra = (ctx, regra) => {
  const real = jurosRealExAnte(ctx.dados, ctx.referencia)
  const coleta = ultimaExpectativa(ctx.dados.expectativas, 'IPCA', '12M', ctx.referencia)
  if (!real || !coleta) return null
  const alto = limite(regra)
  const baixo = limiteSecundario(regra)
  const base = { indicadores: ['SELIC_META' as const, 'IPCA' as const], dataReferencia: coleta.dataColeta }
  const valor = `Juro real ex-ante de ${formatarPercentual(real)} a.a.`
  if (alto && real.gte(alto)) {
    return alerta(regra, { ...base, titulo: 'Juro real elevado', texto: `${valor}: política monetária restritiva.` })
  }
  if (baixo && real.lte(baixo)) {
    return alerta(regra, { ...base, titulo: 'Juro real baixo', texto: `${valor}: política monetária estimulativa.` })
  }
  return informativo(regra, { ...base, titulo: 'Juro real', texto: `${valor} (Selic descontada do IPCA esperado em 12 meses).` })
}

export const dolarMovimento: AvaliadorRegra = (ctx, regra) => {
  const usd = ctx.dados.series.USD ?? []
  const ultimo = ultimoPontoAte(usd, ctx.referencia)
  const mes = ultimo ? mesDe(ultimo.data) : null
  const variacao = mes ? variacaoNoMes(usd, mes) : null
  const limitePct = limite(regra)
  if (!ultimo || !mes || !variacao || !limitePct || variacao.abs().lt(limitePct)) return null

  const desde = ultimoMesComVariacaoMaior(usd, mes, PRIMEIRO_MES_DISPONIVEL)
  const tipo = variacao.gt(0) ? 'alta' : 'queda'
  const historico = desde ? `, a maior ${tipo} mensal desde ${formatarMesAno(desde)}` : `, a maior ${tipo} mensal da série`
  return alerta(regra, {
    titulo: `Dólar em forte ${tipo}`,
    texto: `Dólar ${variacao.gt(0) ? 'subiu' : 'caiu'} ${formatarPercentual(variacao.abs())} no mês até ${formatarData(ultimo.data)}${historico}.`,
    indicadores: ['USD'],
    dataReferencia: ultimo.data,
  })
}

export const dolarVolatilidade: AvaliadorRegra = (ctx, regra) => {
  const usd = ctx.dados.series.USD ?? []
  const ultimo = ultimoPontoAte(usd, ctx.referencia)
  const atual = ultimo ? volatilidade(usd, ultimo.data) : null
  const media = ultimo ? volatilidadeMedia12m(usd, ultimo.data) : null
  const limiteVezes = limite(regra)
  if (!ultimo || !atual || !media || media.isZero() || !limiteVezes) return null
  const razao = atual.div(media)
  if (razao.lt(limiteVezes)) return null
  return alerta(regra, {
    titulo: 'Câmbio volátil',
    texto: `Volatilidade do dólar (${formatarPercentual(atual)} a.a.) está ${formatarNumero(razao, 1)}× a média de 12 meses (${formatarPercentual(media)}).`,
    indicadores: ['USD'],
    dataReferencia: ultimo.data,
  })
}

export const focusRevisoes: AvaliadorRegra = (ctx, regra) => {
  const ano = ctx.referencia.slice(0, 4)
  const semanal = serieSemanal(ctx.dados.expectativas, 'IPCA', ano).filter((p) => p.data <= ctx.referencia)
  const { direcao, semanas } = revisoesSeguidas(semanal)
  const minimo = limite(regra)
  const ultima = semanal.at(-1)
  if (!ultima || !minimo || direcao === 'estavel' || minimo.gt(semanas)) return null
  return alerta(regra, {
    titulo: `Focus: expectativa de IPCA em ${direcao}`,
    texto: `Expectativa de IPCA para ${ano} ${direcao === 'alta' ? 'subiu' : 'caiu'} pela ${semanas}ª semana seguida, para ${formatarPercentual(ultima.valor)}.`,
    indicadores: ['IPCA'],
    dataReferencia: ultima.data,
  })
}

export const cdiReal: AvaliadorRegra = (ctx, regra) => {
  const ipca = ctx.dados.series.IPCA ?? []
  const mes = ultimoMesDisponivel(ipca, mesDe(ctx.referencia))
  if (!mes || mes.slice(0, 4) !== ctx.referencia.slice(0, 4)) return null
  const ipcaAno = acumuladoNoAno(ipca, mes)
  const cdiAno = cdiAcumulado(ctx.dados.series.CDI ?? [], `${mes.slice(0, 4)}-01-01`, ctx.referencia)
  if (!ipcaAno || !cdiAno) return null
  const real = taxaReal(cdiAno, ipcaAno)
  return informativo(regra, {
    titulo: 'Rendimento real do CDI',
    texto: `No ano, o CDI acumula ${formatarPercentual(cdiAno)} e o IPCA ${formatarPercentual(ipcaAno)} (até ${formatarMesAno(mes)}): ganho real de ${formatarPercentual(real)}.`,
    indicadores: ['CDI', 'IPCA'],
    dataReferencia: ctx.referencia,
  })
}

const MESES_COMPARACAO_ATIVIDADE = 3

export const atividadeDesacelera: AvaliadorRegra = (ctx, regra) => {
  const ibc = ctx.dados.series.IBCBR ?? []
  const mes = ultimoMesDisponivel(ibc, mesDe(ctx.referencia))
  const mesAnterior = mes ? somarMeses(mes, -MESES_COMPARACAO_ATIVIDADE) : null
  const atual = mes ? crescimento12m(ibc, mes) : null
  const anterior = mesAnterior ? crescimento12m(ibc, mesAnterior) : null
  const limitePp = limite(regra)
  if (!mes || !mesAnterior || !atual || !anterior || !limitePp) return null
  const queda = anterior.minus(atual)
  const base = { indicadores: ['IBCBR' as const], dataReferencia: primeiroDia(mes) }
  const texto = `crescimento em 12 meses passou de ${formatarPercentual(anterior)} (${formatarMesAno(mesAnterior)}) para ${formatarPercentual(atual)} (${formatarMesAno(mes)}).`
  if (queda.gte(limitePp)) {
    return alerta(regra, { ...base, titulo: 'Atividade desacelerando', texto: `IBC-Br desacelerou: ${texto}` })
  }
  return informativo(regra, { ...base, titulo: 'Atividade econômica', texto: `IBC-Br: ${texto}` })
}
