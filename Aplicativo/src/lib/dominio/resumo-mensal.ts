import { crescimento12m } from './atividade'
import { estatisticasPeriodo, variacao12m, variacaoNoAno, variacaoNoMes } from './cambio'
import { primeiroDia, somarMeses, ultimoDia, ultimoPontoAte } from './datas'
import { formatarMoeda, formatarPercentual } from './formatos'
import { acumulado12m, acumuladoNoAno, faixaDaMeta, situacaoNaMeta, valorDoMes, type SituacaoMeta } from './inflacao'
import { cdiAcumulado, valorVigente } from './juros'
import { Dec, taxaReal } from './numeros'
import type { DadosAnalise, Mes, Ponto } from './tipos'

export interface LinhaResumo {
  indicador: string
  unidade: string
  noMes: Dec | null
  noAno: Dec | null
  em12Meses: Dec | null
  observacao: string | null
}

export interface ResumoMensal {
  mes: Mes
  linhas: LinhaResumo[]
  ipca12m: Dec | null
  situacaoMeta: SituacaoMeta | null
  jurosRealExPost12m: Dec | null
  cdiRealNoAno: Dec | null
}

function linhaIndiceMensal(nome: string, serie: Ponto[], mes: Mes): LinhaResumo {
  const atual = valorDoMes(serie, mes)
  const anterior = valorDoMes(serie, somarMeses(mes, -1))
  return {
    indicador: nome,
    unidade: '%',
    noMes: atual,
    noAno: acumuladoNoAno(serie, mes),
    em12Meses: acumulado12m(serie, mes),
    observacao: atual && anterior ? `Mês anterior: ${formatarPercentual(anterior)}` : null,
  }
}

function linhaCdi(serie: Ponto[], mes: Mes): LinhaResumo {
  const fim = ultimoDia(mes)
  return {
    indicador: 'CDI',
    unidade: '%',
    noMes: cdiAcumulado(serie, primeiroDia(mes), fim),
    noAno: cdiAcumulado(serie, `${mes.slice(0, 4)}-01-01`, fim),
    em12Meses: cdiAcumulado(serie, primeiroDia(somarMeses(mes, -11)), fim),
    observacao: null,
  }
}

function linhaCambio(nome: string, serie: Ponto[], mes: Mes): LinhaResumo {
  const fim = ultimoDia(mes)
  const fechamento = ultimoPontoAte(serie, fim)
  const estatisticas = estatisticasPeriodo(serie, primeiroDia(mes), fim)
  const partes = [
    fechamento ? `Fechamento ${formatarMoeda(fechamento.valor, 4)}` : null,
    estatisticas ? `média ${formatarMoeda(estatisticas.media, 4)}` : null,
  ].filter(Boolean)
  return {
    indicador: nome,
    unidade: 'var. %',
    noMes: variacaoNoMes(serie, mes),
    noAno: variacaoNoAno(serie, fim),
    em12Meses: variacao12m(serie, fim),
    observacao: partes.length ? partes.join('; ') : null,
  }
}

function linhaSelic(serie: Ponto[], mes: Mes): LinhaResumo {
  const vigente = valorVigente(serie, ultimoDia(mes))
  return {
    indicador: 'Meta Selic',
    unidade: '% a.a.',
    noMes: vigente,
    noAno: null,
    em12Meses: null,
    observacao: 'Taxa vigente no fim do mês',
  }
}

function linhaIbcBr(serie: Ponto[], mes: Mes): LinhaResumo {
  return {
    indicador: 'IBC-Br',
    unidade: '%',
    noMes: null,
    noAno: null,
    em12Meses: crescimento12m(serie, mes),
    observacao: 'Crescimento da média de 12 meses',
  }
}

/** Resumo do mês usado no relatório (Planilha Google, .xlsx e rascunho do Gmail). */
export function resumoMensal(dados: DadosAnalise, mes: Mes): ResumoMensal {
  const s = dados.series
  const ipca12m = acumulado12m(s.IPCA ?? [], mes)
  const faixa = faixaDaMeta(dados.metas, Number(mes.slice(0, 4)))
  const cdi12m = cdiAcumulado(s.CDI ?? [], primeiroDia(somarMeses(mes, -11)), ultimoDia(mes))
  const cdiAno = cdiAcumulado(s.CDI ?? [], `${mes.slice(0, 4)}-01-01`, ultimoDia(mes))
  const ipcaAno = acumuladoNoAno(s.IPCA ?? [], mes)

  return {
    mes,
    linhas: [
      linhaIndiceMensal('IPCA', s.IPCA ?? [], mes),
      linhaIndiceMensal('IGP-M', s.IGPM ?? [], mes),
      linhaIndiceMensal('INPC', s.INPC ?? [], mes),
      linhaSelic(s.SELIC_META ?? [], mes),
      linhaCdi(s.CDI ?? [], mes),
      linhaCambio('Dólar PTAX', s.USD ?? [], mes),
      linhaCambio('Euro PTAX', s.EUR ?? [], mes),
      linhaIbcBr(s.IBCBR ?? [], mes),
    ],
    ipca12m,
    situacaoMeta: ipca12m && faixa ? situacaoNaMeta(ipca12m, faixa) : null,
    jurosRealExPost12m: cdi12m && ipca12m ? taxaReal(cdi12m, ipca12m) : null,
    cdiRealNoAno: cdiAno && ipcaAno ? taxaReal(cdiAno, ipcaAno) : null,
  }
}
