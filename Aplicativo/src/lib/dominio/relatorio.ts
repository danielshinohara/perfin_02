import { listarMeses, primeiroDia, somarMeses, ultimoDia, ultimoPontoAte } from './datas'
import { formatarData, formatarMesAno, formatarPercentual } from './formatos'
import { acumulado12m, faixaDaMeta, valorDoMes } from './inflacao'
import { cdiAcumulado, valorVigente } from './juros'
import { Dec, paraGrafico } from './numeros'
import type { ResumoMensal } from './resumo-mensal'
import type { DadosAnalise, Insight, Mes, Ponto, Severidade } from './tipos'

export type Celula = string | number | null

export interface Aba {
  titulo: string
  linhas: Celula[][]
}

export interface ConteudoRelatorio {
  titulo: string
  abas: Aba[]
  /** Índice da aba que recebe o gráfico IPCA 12m × meta. */
  abaGrafico: number
}

const MESES_SERIES = 24
const NOME_SEVERIDADE: Record<Severidade, string> = { alerta: 'Alerta', atencao: 'Atenção', informativo: 'Informativo' }
const NOME_SITUACAO = { abaixo: 'Abaixo do piso', dentro: 'Dentro da banda', acima: 'Acima do teto' } as const

function numero(valor: Dec | null): Celula {
  return valor ? paraGrafico(valor.toDecimalPlaces(4)) : null
}

function abaResumo(resumo: ResumoMensal): Aba {
  return {
    titulo: 'Resumo',
    linhas: [
      ['Indicador', 'Unidade', 'No mês', 'No ano', '12 meses', 'Observação'],
      ...resumo.linhas.map((l) => [l.indicador, l.unidade, numero(l.noMes), numero(l.noAno), numero(l.em12Meses), l.observacao]),
      [],
      ['Destaques', '', '', '', '', ''],
      ['IPCA 12 meses × meta', '%', numero(resumo.ipca12m), null, null, resumo.situacaoMeta ? NOME_SITUACAO[resumo.situacaoMeta] : null],
      ['Juro real ex-post 12m (CDI ÷ IPCA)', '%', numero(resumo.jurosRealExPost12m), null, null, null],
      ['Rendimento real do CDI no ano', '%', numero(resumo.cdiRealNoAno), null, null, null],
    ],
  }
}

function abaInsights(insights: Insight[]): Aba {
  return {
    titulo: 'Insights',
    linhas: [
      ['Severidade', 'Título', 'Descrição', 'Referência'],
      ...insights.map((i) => [NOME_SEVERIDADE[i.severidade], i.titulo, i.texto, formatarData(i.dataReferencia)]),
    ],
  }
}

function fechamento(serie: Ponto[], mes: Mes): Dec | null {
  const ponto = ultimoPontoAte(serie, ultimoDia(mes))
  return ponto && ponto.data >= primeiroDia(mes) ? new Dec(ponto.valor) : null
}

function abaSeries(dados: DadosAnalise, meses: Mes[]): Aba {
  const s = dados.series
  return {
    titulo: 'Séries',
    linhas: [
      ['Mês', 'IPCA (%)', 'IGP-M (%)', 'INPC (%)', 'Selic meta (% a.a.)', 'CDI no mês (%)', 'Dólar (R$)', 'Euro (R$)', 'IBC-Br'],
      ...meses.map((mes) => [
        formatarMesAno(mes),
        numero(valorDoMes(s.IPCA ?? [], mes)),
        numero(valorDoMes(s.IGPM ?? [], mes)),
        numero(valorDoMes(s.INPC ?? [], mes)),
        numero(valorVigente(s.SELIC_META ?? [], ultimoDia(mes))),
        numero(cdiAcumulado(s.CDI ?? [], primeiroDia(mes), ultimoDia(mes))),
        numero(fechamento(s.USD ?? [], mes)),
        numero(fechamento(s.EUR ?? [], mes)),
        numero(valorDoMes(s.IBCBR ?? [], mes)),
      ]),
    ],
  }
}

function abaMeta(dados: DadosAnalise, meses: Mes[]): Aba {
  return {
    titulo: 'IPCA x Meta',
    linhas: [
      ['Mês', 'IPCA 12m (%)', 'Centro (%)', 'Piso (%)', 'Teto (%)'],
      ...meses.map((mes) => {
        const faixa = faixaDaMeta(dados.metas, Number(mes.slice(0, 4)))
        return [
          formatarMesAno(mes),
          numero(acumulado12m(dados.series.IPCA ?? [], mes)),
          numero(faixa?.centro ?? null),
          numero(faixa?.piso ?? null),
          numero(faixa?.teto ?? null),
        ]
      }),
    ],
  }
}

/** Conteúdo da Planilha Google do relatório do mês. */
export function montarConteudoRelatorio(resumo: ResumoMensal, insights: Insight[], dados: DadosAnalise): ConteudoRelatorio {
  const meses = listarMeses(somarMeses(resumo.mes, -(MESES_SERIES - 1)), resumo.mes)
  return {
    titulo: `Portal Perfin — Relatório de indicadores ${formatarMesAno(resumo.mes)}`,
    abas: [abaResumo(resumo), abaInsights(insights), abaSeries(dados, meses), abaMeta(dados, meses)],
    abaGrafico: 3,
  }
}

const DESTAQUES_NO_EMAIL = ['IPCA', 'IGP-M', 'Meta Selic', 'CDI', 'Dólar PTAX']
const INSIGHTS_NO_EMAIL = 3

/** Assunto e corpo do rascunho do Gmail (texto simples). */
export function textoDoRascunho(resumo: ResumoMensal, insights: Insight[]): { assunto: string; corpo: string } {
  const numeros = resumo.linhas
    .filter((l) => DESTAQUES_NO_EMAIL.includes(l.indicador))
    .map((l) => {
      const valor = l.indicador === 'Meta Selic' ? l.noMes : l.em12Meses ?? l.noMes
      const rotulo = l.indicador === 'Meta Selic' ? 'ao ano' : 'em 12 meses'
      return `• ${l.indicador}: ${valor ? formatarPercentual(valor) : 'sem dado'} ${rotulo}`
    })
  const destaques = insights.slice(0, INSIGHTS_NO_EMAIL).map((i) => `• ${i.titulo}: ${i.texto}`)
  const corpo = [
    'Olá,',
    '',
    `Segue o relatório de indicadores econômicos de ${formatarMesAno(resumo.mes)} (planilha anexa).`,
    '',
    'Principais números:',
    ...numeros,
    '',
    'Destaques:',
    ...(destaques.length ? destaques : ['• Sem destaques para o mês.']),
    '',
    'Fontes: BCB e IBGE. Material informativo; não constitui recomendação de investimento.',
  ].join('\n')
  return { assunto: `Relatório de indicadores — ${formatarMesAno(resumo.mes)}`, corpo }
}
