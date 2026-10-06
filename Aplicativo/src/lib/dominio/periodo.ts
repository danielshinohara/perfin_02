import { z } from 'zod'
import { mesDe, somarMeses, ultimoDia } from './datas'
import { CODIGOS_INDICADORES, type CodigoIndicador, type DataISO, type Mes } from './tipos'

export const PRIMEIRO_MES_DISPONIVEL: Mes = '2015-01'
const MESES_PADRAO = 24

export interface Filtros {
  inicio: Mes
  fim: Mes
  indicadores: CodigoIndicador[]
}

export interface ResultadoFiltros {
  filtros: Filtros
  /** Mensagem amigável quando algum parâmetro foi ignorado. */
  aviso: string | null
}

export type ParametrosBusca = Record<string, string | string[] | undefined>

const esquemaMes = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)
const esquemaIndicadores = z
  .string()
  .max(200)
  .transform((texto) => texto.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))
  .pipe(z.array(z.enum(CODIGOS_INDICADORES)).min(1))

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor
}

function filtrosPadrao(hoje: DataISO): Filtros {
  const fim = mesDe(hoje)
  return { inicio: somarMeses(fim, -(MESES_PADRAO - 1)), fim, indicadores: [...CODIGOS_INDICADORES] }
}

/**
 * Lê e valida os filtros da URL (`inicio`, `fim`, `ind`). Valores inválidos são substituídos
 * pelo padrão (últimos 24 meses, todos os indicadores) e geram um aviso.
 */
export function lerFiltros(parametros: ParametrosBusca, hoje: DataISO): ResultadoFiltros {
  const padrao = filtrosPadrao(hoje)
  const inicio = esquemaMes.safeParse(primeiro(parametros.inicio))
  const fim = esquemaMes.safeParse(primeiro(parametros.fim))
  // `ind` pode vir repetido (checkboxes do formulário) ou separado por vírgula.
  const textoIndicadores = Array.isArray(parametros.ind) ? parametros.ind.join(',') : parametros.ind
  const indicadores = esquemaIndicadores.safeParse(textoIndicadores ?? '')

  const filtros: Filtros = {
    inicio: inicio.success ? inicio.data : padrao.inicio,
    fim: fim.success ? fim.data : padrao.fim,
    indicadores: indicadores.success ? [...new Set(indicadores.data)] : padrao.indicadores,
  }
  const invalidos =
    (primeiro(parametros.inicio) !== undefined && !inicio.success) ||
    (primeiro(parametros.fim) !== undefined && !fim.success) ||
    (textoIndicadores !== undefined && !indicadores.success)

  if (filtros.fim > padrao.fim) filtros.fim = padrao.fim
  if (filtros.inicio < PRIMEIRO_MES_DISPONIVEL) filtros.inicio = PRIMEIRO_MES_DISPONIVEL
  if (filtros.inicio > filtros.fim) {
    return { filtros: padrao, aviso: 'O mês inicial era posterior ao final; mostrando os últimos 24 meses.' }
  }
  const aviso = invalidos ? 'Alguns filtros eram inválidos e foram ajustados.' : null
  return { filtros, aviso }
}

/** Data de referência da análise: o fim do filtro, limitado a hoje. */
export function dataDeReferencia(filtros: Filtros, hoje: DataISO): DataISO {
  const fimDoFiltro = ultimoDia(filtros.fim)
  return fimDoFiltro < hoje ? fimDoFiltro : hoje
}

export function filtrosParaBusca(filtros: Filtros): string {
  const parametros = new URLSearchParams({ inicio: filtros.inicio, fim: filtros.fim })
  if (filtros.indicadores.length < CODIGOS_INDICADORES.length) {
    parametros.set('ind', filtros.indicadores.join(','))
  }
  return parametros.toString()
}

/** Primeiro mês com 12 meses de histórico para o relatório. */
const PRIMEIRO_MES_RELATORIO: Mes = '2016-01'

/** Valida o mês do relatório: formato `AAAA-MM`, a partir de 2016 e só meses já encerrados. */
export function validarMesRelatorio(valor: unknown, hoje: DataISO): Mes | null {
  const resultado = esquemaMes.safeParse(valor)
  if (!resultado.success) return null
  const mes = resultado.data
  return mes >= PRIMEIRO_MES_RELATORIO && mes < mesDe(hoje) ? mes : null
}

/** Mês padrão do relatório: o último mês fechado. */
export function mesPadraoRelatorio(hoje: DataISO): Mes {
  return somarMeses(mesDe(hoje), -1)
}
