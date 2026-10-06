import 'server-only'
import { hojeEmSaoPaulo } from '@/lib/dominio/datas'
import { gerarInsights } from '@/lib/dominio/insights/gerar'
import { filtrosParaBusca, lerFiltros, type Filtros, type ParametrosBusca } from '@/lib/dominio/periodo'
import type { CodigoIndicador, DadosAnalise, DataISO, Insight } from '@/lib/dominio/tipos'
import { criarClienteServidor } from '@/lib/supabase/servidor'
import { carregarDadosPainel, carregarRegras } from './indicadores'

export type { ParametrosBusca }

export interface ContextoPagina {
  hoje: DataISO
  filtros: Filtros
  aviso: string | null
  dados: DadosAnalise
  referencia: DataISO
  atualizadoEm: string | null
  insights: Insight[]
  /** Query string dos filtros (para links e para o assistente). */
  busca: string
}

/** Carrega filtros validados, dados do período e insights para uma página de painel. */
export async function carregarContextoPagina(parametros: ParametrosBusca): Promise<ContextoPagina> {
  const hoje = hojeEmSaoPaulo()
  const { filtros, aviso } = lerFiltros(parametros, hoje)
  const supabase = await criarClienteServidor()
  const [painel, regras] = await Promise.all([carregarDadosPainel(supabase, filtros, hoje), carregarRegras(supabase)])
  const insights = gerarInsights({ dados: painel.dados, referencia: painel.referencia, filtros }, regras)
  return { hoje, filtros, aviso, ...painel, insights, busca: filtrosParaBusca(filtros) }
}

export function insightsDe(insights: Insight[], indicadores: CodigoIndicador[]): Insight[] {
  return insights.filter((i) => i.indicadores.some((c) => indicadores.includes(c)))
}
