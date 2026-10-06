import { listarMeses, mesDe, pontosEntre, primeiroDia, somarDias } from './datas'
import { indexarMensal, ultimoMesDisponivel } from './inflacao'
import { CEM, Dec, fatorAcumulado, UM } from './numeros'
import type { DataISO, Ponto } from './tipos'

export const INDICES_CORRECAO = ['IPCA', 'IGPM', 'INPC', 'CDI'] as const
export type IndiceCorrecao = (typeof INDICES_CORRECAO)[number]

export interface ResultadoCorrecao {
  fator: Dec
  valorCorrigido: Dec
  variacaoPct: Dec
  /** Último mês (índices mensais) ou dia (CDI) efetivamente aplicado. */
  aplicadoAte: DataISO
  /** Verdadeiro quando o índice ainda não tem dados até a data final pedida. */
  parcial: boolean
}

export class DadosInsuficientesError extends Error {}

interface Fator {
  fator: Dec
  aplicadoAte: DataISO
  parcial: boolean
}

/**
 * Índices mensais: aplica as variações do mês da data inicial até o mês da data final (inclusive),
 * a mesma convenção da Calculadora do Cidadão do BCB. Se os últimos meses ainda não foram
 * divulgados, corrige até o último mês disponível e marca o resultado como parcial.
 */
function fatorMensal(serie: Ponto[], inicio: DataISO, fim: DataISO): Fator {
  const ultimoMes = ultimoMesDisponivel(serie, mesDe(fim))
  if (!ultimoMes || ultimoMes < mesDe(inicio)) throw new DadosInsuficientesError('O índice ainda não tem dados para o período')
  const indice = indexarMensal(serie)
  const variacoes = listarMeses(mesDe(inicio), ultimoMes).map((mes) => {
    const v = indice.get(mes)
    if (!v) throw new DadosInsuficientesError(`Falta o índice de ${primeiroDia(mes)}`)
    return v
  })
  return { fator: fatorAcumulado(variacoes), aplicadoAte: primeiroDia(ultimoMes), parcial: ultimoMes < mesDe(fim) }
}

/** Dias corridos de tolerância para fim de semana e feriados prolongados sem CDI. */
const TOLERANCIA_DIAS_CDI = 5

/** CDI: compõe as taxas diárias da data inicial (inclusive) até a véspera da data final. */
function fatorCdi(serie: Ponto[], inicio: DataISO, fim: DataISO): Fator {
  const vespera = somarDias(fim, -1)
  const dias = pontosEntre(serie, inicio, vespera)
  if (dias.length === 0) throw new DadosInsuficientesError('Sem CDI para o período')
  const ultimo = dias.at(-1)!.data
  return {
    fator: fatorAcumulado(dias.map((p) => new Dec(p.valor))),
    aplicadoAte: ultimo,
    parcial: ultimo < somarDias(vespera, -TOLERANCIA_DIAS_CDI),
  }
}

export interface EntradaCorrecao {
  valor: Dec
  indice: IndiceCorrecao
  inicio: DataISO
  fim: DataISO
}

const VALOR_MAXIMO = new Dec('1e13')
const PADRAO_DATA = /^\d{4}-\d{2}-\d{2}$/
const FORMATO_BRASILEIRO = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$|^\d+,\d{1,2}$/
const FORMATO_SIMPLES = /^\d+(\.\d{1,2})?$/

/**
 * Lê um valor em reais. Aceita "1.234,56", "1.000", "1234,56", "1234.56" e "1234".
 * Ponto seguido de 3 dígitos é separador de milhar; ponto com 1 ou 2 dígitos é decimal.
 */
export function lerValorMonetario(texto: string): Dec | null {
  const limpo = texto.trim().replace(/\s|R\$/g, '')
  let normalizado: string
  if (FORMATO_BRASILEIRO.test(limpo)) normalizado = limpo.replace(/\./g, '').replace(',', '.')
  else if (FORMATO_SIMPLES.test(limpo)) normalizado = limpo
  else return null
  const valor = new Dec(normalizado)
  return valor.gt(0) && valor.lt(VALOR_MAXIMO) ? valor : null
}

export interface CamposCorrecao {
  valor: string
  indice: string
  inicio: string
  fim: string
}

/** Valida os campos do formulário da calculadora. */
export function lerEntradaCorrecao(campos: CamposCorrecao, hoje: DataISO): { entrada: EntradaCorrecao | null; erro: string | null } {
  const valor = lerValorMonetario(campos.valor)
  const indice = INDICES_CORRECAO.find((i) => i === campos.indice)
  const { inicio, fim } = campos
  if (!valor) return { entrada: null, erro: 'Informe um valor maior que zero, como 1.000,00.' }
  if (!indice) return { entrada: null, erro: 'Escolha um índice válido.' }
  if (!PADRAO_DATA.test(inicio) || !PADRAO_DATA.test(fim)) return { entrada: null, erro: 'Informe as datas inicial e final.' }
  if (inicio < '2015-01-01' || fim > hoje) return { entrada: null, erro: 'Use datas entre 01/01/2015 e hoje.' }
  if (fim <= inicio) return { entrada: null, erro: 'A data final deve ser posterior à inicial.' }
  return { entrada: { valor, indice, inicio, fim }, erro: null }
}

/** Corrige um valor monetário. Arredonda para centavos (meio para cima) só no resultado final. */
export function corrigirValor(
  valor: Dec,
  indice: IndiceCorrecao,
  serie: Ponto[],
  inicio: DataISO,
  fim: DataISO,
): ResultadoCorrecao {
  if (fim <= inicio) throw new RangeError('A data final deve ser posterior à inicial')
  const { fator, aplicadoAte, parcial } = indice === 'CDI' ? fatorCdi(serie, inicio, fim) : fatorMensal(serie, inicio, fim)
  return {
    fator,
    valorCorrigido: valor.times(fator).toDecimalPlaces(2, Dec.ROUND_HALF_UP),
    variacaoPct: fator.minus(UM).times(CEM),
    aplicadoAte,
    parcial,
  }
}
