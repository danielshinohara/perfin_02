import type { Filtros } from '../periodo'
import type { CodigoIndicador, DadosAnalise, DataISO, Insight, RegraAlerta, Severidade } from '../tipos'
import { Dec } from '../numeros'

export interface ContextoInsights {
  dados: DadosAnalise
  /** Data de referência da análise (fim do filtro, limitado a hoje). */
  referencia: DataISO
  filtros: Filtros
}

export type AvaliadorRegra = (ctx: ContextoInsights, regra: RegraAlerta) => Insight | null

export function limite(regra: RegraAlerta): Dec | null {
  return regra.limite === null ? null : new Dec(regra.limite)
}

export function limiteSecundario(regra: RegraAlerta): Dec | null {
  return regra.limiteSecundario === null ? null : new Dec(regra.limiteSecundario)
}

interface DadosInsight {
  titulo: string
  texto: string
  indicadores: CodigoIndicador[]
  dataReferencia: DataISO
}

/** Insight que passou do limite: usa a severidade configurada na regra. */
export function alerta(regra: RegraAlerta, dados: DadosInsight): Insight {
  return { ...dados, regra: regra.codigo, severidade: regra.severidade, ehAlerta: true }
}

/** Insight apenas informativo (dentro dos limites). */
export function informativo(regra: RegraAlerta, dados: DadosInsight): Insight {
  return { ...dados, regra: regra.codigo, severidade: 'informativo', ehAlerta: false }
}

const PESO: Record<Severidade, number> = { alerta: 0, atencao: 1, informativo: 2 }

export function ordenarInsights(insights: Insight[]): Insight[] {
  return [...insights].sort(
    (a, b) => PESO[a.severidade] - PESO[b.severidade] || b.dataReferencia.localeCompare(a.dataReferencia),
  )
}
