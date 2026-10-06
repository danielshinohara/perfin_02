import { anoDe, listarMeses, primeiroDia, somarMeses, ultimoDia } from '../datas'
import { ultimaExpectativa } from '../expectativas'
import { formatarData, formatarMesAno } from '../formatos'
import { acumulado12m, acumuladoNoAno, faixaDaMeta, valorDoMes } from '../inflacao'
import { cdiAcumulado, decisoesCopom, valorVigente, type DecisaoCopom } from '../juros'
import { NOMES_INDICADORES } from '../nomes'
import { Dec, numeroOuNulo, paraGrafico, taxaReal } from '../numeros'
import type { Filtros } from '../periodo'
import type { CodigoIndicador, DadosAnalise, DataISO } from '../tipos'
import type { DadosGrafico, LinhaGrafico } from './tipos'


function indicesSelecionados(filtros: Filtros): CodigoIndicador[] {
  const selecionados = (['IPCA', 'IGPM', 'INPC'] as const).filter((c) => filtros.indicadores.includes(c))
  return selecionados.length ? selecionados : ['IPCA']
}

export function graficoInflacaoMensal(dados: DadosAnalise, filtros: Filtros): DadosGrafico {
  const codigos = indicesSelecionados(filtros)
  return {
    titulo: 'Inflação mensal',
    descricao: 'Variação no mês (%)',
    unidade: 'percentual',
    series: codigos.map((c) => ({ chave: c, nome: NOMES_INDICADORES[c] })),
    linhas: listarMeses(filtros.inicio, filtros.fim).map((mes) => ({
      rotulo: formatarMesAno(mes),
      ...Object.fromEntries(codigos.map((c) => [c, numeroOuNulo(valorDoMes(dados.series[c] ?? [], mes))])),
    })),
  }
}

export function graficoInflacao12m(dados: DadosAnalise, filtros: Filtros): DadosGrafico {
  const codigos = indicesSelecionados(filtros)
  return {
    titulo: 'Inflação acumulada em 12 meses × meta',
    descricao: 'Acumulado em 12 meses (%), com a banda da meta de inflação sombreada',
    unidade: 'percentual',
    series: codigos.map((c) => ({ chave: c, nome: NOMES_INDICADORES[c] })),
    faixa: { inferior: 'piso', superior: 'teto', nome: 'Banda da meta' },
    linhas: listarMeses(filtros.inicio, filtros.fim).map((mes) => {
      const meta = faixaDaMeta(dados.metas, anoDe(mes))
      return {
        rotulo: formatarMesAno(mes),
        piso: numeroOuNulo(meta?.piso ?? null),
        teto: numeroOuNulo(meta?.teto ?? null),
        ...Object.fromEntries(codigos.map((c) => [c, numeroOuNulo(acumulado12m(dados.series[c] ?? [], mes))])),
      }
    }),
  }
}

export function graficoSpread(dados: DadosAnalise, filtros: Filtros): DadosGrafico {
  return {
    titulo: 'Diferença IGP-M − IPCA em 12 meses',
    descricao: 'Pontos percentuais. Positivo: contratos por IGP-M sobem mais que a inflação ao consumidor.',
    unidade: 'pontos',
    series: [{ chave: 'spread', nome: 'IGP-M − IPCA' }],
    linhas: listarMeses(filtros.inicio, filtros.fim).map((mes) => {
      const igpm = acumulado12m(dados.series.IGPM ?? [], mes)
      const ipca = acumulado12m(dados.series.IPCA ?? [], mes)
      return { rotulo: formatarMesAno(mes), spread: numeroOuNulo(igpm && ipca ? igpm.minus(ipca) : null) }
    }),
  }
}

/** Esperado (1ª mediana do Focus no ano) × realizado (IPCA do ano), para cada ano fechado do período. */
export function graficoEsperadoRealizado(dados: DadosAnalise, filtros: Filtros, referencia: DataISO): DadosGrafico {
  const anos: number[] = []
  for (let ano = anoDe(filtros.inicio); ano <= anoDe(filtros.fim) && `${ano}-12-31` <= referencia; ano++) anos.push(ano)
  const linhas = anos.map((ano) => {
    const primeiraDoAno = dados.expectativas
      .filter((e) => e.indicador === 'IPCA' && e.referencia === String(ano) && e.dataColeta.startsWith(String(ano)))
      .sort((a, b) => a.dataColeta.localeCompare(b.dataColeta))[0]
    return {
      rotulo: String(ano),
      esperado: primeiraDoAno ? paraGrafico(new Dec(primeiraDoAno.mediana)) : null,
      realizado: numeroOuNulo(acumuladoNoAno(dados.series.IPCA ?? [], `${ano}-12`)),
    }
  })
  return {
    titulo: 'IPCA: esperado × realizado',
    descricao: 'Expectativa do Focus no início do ano × IPCA efetivo do ano (%)',
    unidade: 'percentual',
    series: [
      { chave: 'esperado', nome: 'Esperado (Focus, jan.)' },
      { chave: 'realizado', nome: 'Realizado' },
    ],
    linhas,
  }
}

export function graficoSelic(dados: DadosAnalise, filtros: Filtros): DadosGrafico {
  return {
    titulo: 'Meta Selic',
    descricao: 'Taxa vigente no fim de cada mês (% a.a.)',
    unidade: 'percentual',
    series: [{ chave: 'selic', nome: 'Meta Selic' }],
    linhas: listarMeses(filtros.inicio, filtros.fim).map((mes) => ({
      rotulo: formatarMesAno(mes),
      selic: numeroOuNulo(valorVigente(dados.series.SELIC_META ?? [], ultimoDia(mes))),
    })),
  }
}

export function decisoesNoPeriodo(dados: DadosAnalise, filtros: Filtros): (DecisaoCopom & { rotulo: string })[] {
  const inicio = primeiroDia(filtros.inicio)
  const fim = ultimoDia(filtros.fim)
  return decisoesCopom(dados.series.SELIC_META ?? [])
    .filter((d) => d.data >= inicio && d.data <= fim)
    .map((d) => ({ ...d, rotulo: formatarData(d.data) }))
}

export function graficoCdiAcumulado(dados: DadosAnalise, filtros: Filtros, referencia: DataISO): DadosGrafico {
  const inicio = primeiroDia(filtros.inicio)
  return {
    titulo: 'CDI acumulado no período',
    descricao: `Acumulado desde ${formatarMesAno(filtros.inicio)} (%)`,
    unidade: 'percentual',
    series: [{ chave: 'cdi', nome: 'CDI acumulado' }],
    linhas: listarMeses(filtros.inicio, filtros.fim).map((mes) => {
      const fim = ultimoDia(mes) < referencia ? ultimoDia(mes) : referencia
      return { rotulo: formatarMesAno(mes), cdi: numeroOuNulo(cdiAcumulado(dados.series.CDI ?? [], inicio, fim)) }
    }),
  }
}

function juroRealExPost(dados: DadosAnalise, mes: string): Dec | null {
  const ipca = acumulado12m(dados.series.IPCA ?? [], mes)
  const cdi = cdiAcumulado(dados.series.CDI ?? [], primeiroDia(somarMeses(mes, -11)), ultimoDia(mes))
  return ipca && cdi ? taxaReal(cdi, ipca) : null
}

export function graficoJuroReal(dados: DadosAnalise, filtros: Filtros): DadosGrafico {
  const linhas: LinhaGrafico[] = listarMeses(filtros.inicio, filtros.fim).map((mes) => {
    const selic = valorVigente(dados.series.SELIC_META ?? [], ultimoDia(mes))
    const esperado = ultimaExpectativa(dados.expectativas, 'IPCA', '12M', ultimoDia(mes))
    return {
      rotulo: formatarMesAno(mes),
      exAnte: numeroOuNulo(selic && esperado ? taxaReal(selic, new Dec(esperado.mediana)) : null),
      exPost: numeroOuNulo(juroRealExPost(dados, mes)),
    }
  })
  return {
    titulo: 'Juro real',
    descricao: 'Ex-ante: Selic ÷ IPCA esperado em 12 meses. Ex-post: CDI 12m ÷ IPCA 12m (% a.a.)',
    unidade: 'percentual',
    series: [
      { chave: 'exAnte', nome: 'Ex-ante' },
      { chave: 'exPost', nome: 'Ex-post' },
    ],
    linhas,
  }
}
