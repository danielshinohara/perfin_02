import { crescimento12m, variacaoInteranual } from '../atividade'
import { estatisticasPeriodo, variacaoNoPeriodo, volatilidade, volatilidadeMedia12m, type EstatisticasPeriodo } from '../cambio'
import { anoDe, listarMeses, pontosEntre, primeiroDia, ultimoDia } from '../datas'
import { serieSemanal } from '../expectativas'
import { formatarData, formatarMesAno } from '../formatos'
import { valorDoMes } from '../inflacao'
import { NOMES_INDICADORES } from '../nomes'
import { Dec, numeroOuNulo, paraGrafico } from '../numeros'
import type { Filtros } from '../periodo'
import type { CodigoIndicador, DadosAnalise, DataISO, IndicadorFocus } from '../tipos'
import type { DadosGrafico, LinhaGrafico } from './tipos'

/** Acima disto, a série diária é reduzida a um ponto por semana para não pesar o gráfico. */
const MAXIMO_PONTOS_DIARIOS = 400

function moedasSelecionadas(filtros: Filtros): CodigoIndicador[] {
  const moedas = (['USD', 'EUR'] as const).filter((c) => filtros.indicadores.includes(c))
  return moedas.length ? moedas : ['USD']
}

export function graficoCambio(dados: DadosAnalise, filtros: Filtros, referencia: DataISO): DadosGrafico {
  const moedas = moedasSelecionadas(filtros)
  const porData = new Map<DataISO, LinhaGrafico>()
  for (const moeda of moedas) {
    for (const p of pontosEntre(dados.series[moeda] ?? [], primeiroDia(filtros.inicio), referencia)) {
      const linha = porData.get(p.data) ?? { rotulo: formatarData(p.data) }
      linha[moeda] = paraGrafico(new Dec(p.valor))
      porData.set(p.data, linha)
    }
  }
  const datas = [...porData.keys()].sort()
  const passo = Math.ceil(datas.length / MAXIMO_PONTOS_DIARIOS)
  const linhas = datas.filter((_, i) => i % passo === 0 || i === datas.length - 1).map((d) => porData.get(d)!)
  return {
    titulo: 'Cotações PTAX (venda)',
    descricao: passo > 1 ? 'R$ por unidade da moeda (amostra semanal)' : 'R$ por unidade da moeda',
    unidade: 'moeda',
    series: moedas.map((m) => ({ chave: m, nome: NOMES_INDICADORES[m] })),
    linhas,
  }
}

export interface ResumoMoeda {
  codigo: CodigoIndicador
  nome: string
  estatisticas: EstatisticasPeriodo | null
  variacaoPeriodo: Dec | null
}

export function resumoCambio(dados: DadosAnalise, filtros: Filtros, referencia: DataISO): ResumoMoeda[] {
  return moedasSelecionadas(filtros).map((codigo) => {
    const serie = dados.series[codigo] ?? []
    return {
      codigo,
      nome: NOMES_INDICADORES[codigo],
      estatisticas: estatisticasPeriodo(serie, primeiroDia(filtros.inicio), referencia),
      variacaoPeriodo: variacaoNoPeriodo(serie, primeiroDia(filtros.inicio), referencia),
    }
  })
}

export function graficoVolatilidade(dados: DadosAnalise, filtros: Filtros, referencia: DataISO): DadosGrafico {
  const usd = dados.series.USD ?? []
  return {
    titulo: 'Volatilidade do dólar',
    descricao: 'Desvio-padrão dos retornos diários em 21 dias úteis, anualizado (% a.a.)',
    unidade: 'percentual',
    series: [
      { chave: 'vol', nome: 'Volatilidade' },
      { chave: 'media', nome: 'Média de 12 meses' },
    ],
    linhas: listarMeses(filtros.inicio, filtros.fim).map((mes) => {
      const fim = ultimoDia(mes) < referencia ? ultimoDia(mes) : referencia
      return { rotulo: formatarMesAno(mes), vol: numeroOuNulo(volatilidade(usd, fim)), media: numeroOuNulo(volatilidadeMedia12m(usd, fim)) }
    }),
  }
}

export function graficoIbcBr(dados: DadosAnalise, filtros: Filtros): DadosGrafico {
  const ibc = dados.series.IBCBR ?? []
  return {
    titulo: 'IBC-Br: crescimento em 12 meses',
    descricao: 'Média dos últimos 12 meses contra os 12 anteriores (%)',
    unidade: 'percentual',
    series: [{ chave: 'crescimento', nome: 'Crescimento 12m' }],
    linhas: listarMeses(filtros.inicio, filtros.fim).map((mes) => ({
      rotulo: formatarMesAno(mes),
      crescimento: numeroOuNulo(crescimento12m(ibc, mes)),
    })),
  }
}

export function graficoIbcBrNivel(dados: DadosAnalise, filtros: Filtros): DadosGrafico {
  return {
    titulo: 'IBC-Br (nível)',
    descricao: 'Índice dessazonalizado',
    unidade: 'indice',
    series: [{ chave: 'nivel', nome: 'IBC-Br' }],
    linhas: listarMeses(filtros.inicio, filtros.fim).map((mes) => ({
      rotulo: formatarMesAno(mes),
      nivel: numeroOuNulo(valorDoMes(dados.series.IBCBR ?? [], mes)),
    })),
  }
}

export function graficoFbcf(dados: DadosAnalise, filtros: Filtros): DadosGrafico {
  const real = dados.series.FBCF_REAL ?? []
  const nominal = dados.series.FBCF ?? []
  const trimestres = real.filter((p) => p.data >= primeiroDia(filtros.inicio) && p.data <= ultimoDia(filtros.fim))
  return {
    titulo: 'Investimento (FBCF)',
    descricao: 'Variação contra o mesmo trimestre do ano anterior (%): real (volume) e nominal (valores correntes)',
    unidade: 'percentual',
    series: [
      { chave: 'real', nome: 'Real' },
      { chave: 'nominal', nome: 'Nominal' },
    ],
    linhas: trimestres.map((p) => ({
      rotulo: `T${Math.floor(Number(p.data.slice(5, 7)) / 3) + 1}/${anoDe(p.data)}`,
      real: paraGrafico(new Dec(p.valor)),
      nominal: numeroOuNulo(variacaoInteranual(nominal, p.data)),
    })),
  }
}

const TITULOS_FOCUS: Record<IndicadorFocus, { titulo: string; unidade: DadosGrafico['unidade'] }> = {
  IPCA: { titulo: 'Focus: IPCA esperado', unidade: 'percentual' },
  SELIC: { titulo: 'Focus: Selic esperada no fim do ano', unidade: 'percentual' },
  CAMBIO: { titulo: 'Focus: dólar esperado no fim do ano', unidade: 'moeda' },
  PIB: { titulo: 'Focus: crescimento do PIB esperado', unidade: 'percentual' },
}

/** Evolução semanal das medianas do Focus para o ano da referência e o seguinte. */
export function graficoFocus(dados: DadosAnalise, indicador: IndicadorFocus, filtros: Filtros, referencia: DataISO): DadosGrafico {
  const ano = anoDe(referencia)
  const atual = serieSemanal(dados.expectativas, indicador, String(ano))
  const seguinte = serieSemanal(dados.expectativas, indicador, String(ano + 1))
  const porSemana = new Map<DataISO, LinhaGrafico>()
  const inicio = primeiroDia(filtros.inicio)
  for (const [chave, serie] of [['atual', atual], ['seguinte', seguinte]] as const) {
    for (const p of serie.filter((p) => p.data >= inicio && p.data <= referencia)) {
      const linha = porSemana.get(p.data) ?? { rotulo: formatarData(p.data) }
      linha[chave] = paraGrafico(new Dec(p.valor))
      porSemana.set(p.data, linha)
    }
  }
  return {
    titulo: TITULOS_FOCUS[indicador].titulo,
    descricao: 'Mediana das projeções do mercado, semana a semana',
    unidade: TITULOS_FOCUS[indicador].unidade,
    series: [
      { chave: 'atual', nome: String(ano) },
      { chave: 'seguinte', nome: String(ano + 1) },
    ],
    linhas: [...porSemana.keys()].sort().map((d) => porSemana.get(d)!),
  }
}
