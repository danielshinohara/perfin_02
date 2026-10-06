import 'server-only'
import { hojeEmSaoPaulo, listarMeses, mesDe, primeiroDia, somarMeses, ultimoDia } from '@/lib/dominio/datas'
import { formatarData, formatarMesAno } from '@/lib/dominio/formatos'
import { gerarInsightsPublicos } from '@/lib/dominio/insights/gerar'
import { acumulado12m } from '@/lib/dominio/inflacao'
import { cdiAcumulado, valorVigente } from '@/lib/dominio/juros'
import { paraGrafico } from '@/lib/dominio/numeros'
import { formatarValorKpi, kpisTermometro } from '@/lib/dominio/resumo'
import type { CodigoIndicador, DadosAnalise, DataISO, MetaInflacao } from '@/lib/dominio/tipos'
import { criarClienteAnonimo } from '@/lib/supabase/anonimo'
import { carregarSeries, carregarUltimaAtualizacao } from './indicadores'

const PUBLICOS: CodigoIndicador[] = ['IPCA', 'IGPM', 'SELIC_META', 'CDI', 'USD']
const MESES_GRAFICO = 24
const MESES_HISTORICO = 12

export interface TermometroPublico {
  atualizadoEm: DataISO
  indicadores: { id: string; titulo: string; valor: number | null; valorFormatado: string; referencia: string | null; complemento: string | null }[]
  graficos: { id: string; titulo: string; unidade: 'percentual' | 'moeda'; pontos: { mes: string; valor: number | null }[] }[]
  insights: { titulo: string; texto: string }[]
  fonte: string
}

function graficos(dados: DadosAnalise, hoje: DataISO): TermometroPublico['graficos'] {
  const meses = listarMeses(somarMeses(mesDe(hoje), -(MESES_GRAFICO - 1)), mesDe(hoje))
  const s = dados.series
  const serie = (calculo: (mes: string) => ReturnType<typeof acumulado12m>) =>
    meses.map((mes) => {
      const v = calculo(mes)
      return { mes: formatarMesAno(mes), valor: v ? paraGrafico(v) : null }
    })
  return [
    { id: 'IPCA_12M', titulo: 'IPCA em 12 meses (%)', unidade: 'percentual', pontos: serie((m) => acumulado12m(s.IPCA ?? [], m)) },
    { id: 'IGPM_12M', titulo: 'IGP-M em 12 meses (%)', unidade: 'percentual', pontos: serie((m) => acumulado12m(s.IGPM ?? [], m)) },
    { id: 'SELIC', titulo: 'Meta Selic (% a.a.)', unidade: 'percentual', pontos: serie((m) => valorVigente(s.SELIC_META ?? [], ultimoDia(m))) },
    {
      id: 'CDI_12M',
      titulo: 'CDI em 12 meses (%)',
      unidade: 'percentual',
      pontos: serie((m) => cdiAcumulado(s.CDI ?? [], primeiroDia(somarMeses(m, -11)), ultimoDia(m))),
    },
    { id: 'USD', titulo: 'Dólar PTAX (R$, fim do mês)', unidade: 'moeda', pontos: serie((m) => valorVigente(s.USD ?? [], ultimoDia(m))) },
  ]
}

/** Dados do "Termômetro da economia" do site: só indicadores públicos, lidos sem sessão (papel anon). */
export async function montarTermometroPublico(hoje: DataISO): Promise<TermometroPublico> {
  const supabase = criarClienteAnonimo()
  const desde = primeiroDia(somarMeses(mesDe(hoje), -(MESES_GRAFICO + MESES_HISTORICO)))
  const [series, atualizadoEm, metas] = await Promise.all([
    carregarSeries(supabase, PUBLICOS, desde, hoje),
    carregarUltimaAtualizacao(supabase),
    supabase.rpc('metas_inflacao_publicas').then(({ data, error }) => {
      if (error) throw new Error('Não foi possível carregar as metas de inflação')
      return ((data ?? []) as { ano: number; centro: number; tolerancia: number }[]).map(
        (m): MetaInflacao => ({ ano: m.ano, centro: String(m.centro), tolerancia: String(m.tolerancia) }),
      )
    }),
  ])
  const dados: DadosAnalise = { series, metas, expectativas: [] }
  const filtros = { inicio: somarMeses(mesDe(hoje), -11), fim: mesDe(hoje), indicadores: PUBLICOS }
  return {
    // Data da última carga dos dados (não a da requisição), para o site não parecer atualizado sem estar.
    atualizadoEm: atualizadoEm ? hojeEmSaoPaulo(new Date(atualizadoEm)) : hoje,
    indicadores: kpisTermometro(dados, hoje, true).map((k) => ({
      id: k.id,
      titulo: k.titulo,
      valor: k.valor ? paraGrafico(k.valor) : null,
      valorFormatado: formatarValorKpi(k),
      referencia: k.referencia ? formatarData(k.referencia) : null,
      complemento: k.complemento,
    })),
    graficos: graficos(dados, hoje),
    insights: gerarInsightsPublicos({ dados, referencia: hoje, filtros }).map((i) => ({ titulo: i.titulo, texto: i.texto })),
    fonte: 'Banco Central do Brasil (SGS) e IBGE',
  }
}
