import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { primeiroDia, somarMeses } from '@/lib/dominio/datas'
import { dataDeReferencia, PRIMEIRO_MES_DISPONIVEL, type Filtros } from '@/lib/dominio/periodo'
import {
  CODIGOS_INDICADORES,
  type CodigoIndicador,
  type DadosAnalise,
  type DataISO,
  type Expectativa,
  type MetaInflacao,
  type RegraAlerta,
  type Series,
} from '@/lib/dominio/tipos'

const TAMANHO_PAGINA = 1000
/** Histórico extra antes do filtro, para acumulados de 12 meses e médias de 24 meses. */
const MESES_HISTORICO = 25
const INICIO_DADOS = primeiroDia(PRIMEIRO_MES_DISPONIVEL)

interface LinhaValor {
  data_referencia: string
  valor: string | number
}

function erroConsulta(o: string): Error {
  return new Error(`Não foi possível carregar ${o}. Tente novamente em instantes.`)
}

async function carregarSerie(supabase: SupabaseClient, codigo: CodigoIndicador, desde: DataISO, ate: DataISO) {
  const pontos: { data: DataISO; valor: string }[] = []
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await supabase
      .from('indicador_valores')
      .select('data_referencia, valor')
      .eq('indicador_codigo', codigo)
      .gte('data_referencia', desde)
      .lte('data_referencia', ate)
      .order('data_referencia')
      .range(inicio, inicio + TAMANHO_PAGINA - 1)
    if (error) throw erroConsulta(`a série ${codigo}`)
    const linhas = (data ?? []) as LinhaValor[]
    pontos.push(...linhas.map((l) => ({ data: l.data_referencia, valor: String(l.valor) })))
    if (linhas.length < TAMANHO_PAGINA) return pontos
  }
}

/** Carrega as séries em paralelo (o PostgREST devolve no máximo 1.000 linhas por página). */
export async function carregarSeries(
  supabase: SupabaseClient,
  codigos: readonly CodigoIndicador[],
  desde: DataISO,
  ate: DataISO,
): Promise<Series> {
  const series = await Promise.all(codigos.map((c) => carregarSerie(supabase, c, desde, ate)))
  return Object.fromEntries(codigos.map((c, i) => [c, series[i]]))
}

export async function carregarMetas(supabase: SupabaseClient): Promise<MetaInflacao[]> {
  const { data, error } = await supabase.from('metas_inflacao').select('ano, centro, tolerancia').order('ano')
  if (error) throw erroConsulta('as metas de inflação')
  return (data ?? []).map((m) => ({ ano: m.ano, centro: String(m.centro), tolerancia: String(m.tolerancia) }))
}

export async function carregarExpectativas(supabase: SupabaseClient, desde: DataISO): Promise<Expectativa[]> {
  const expectativas: Expectativa[] = []
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await supabase
      .from('expectativas_focus')
      .select('indicador, referencia, data_coleta, mediana')
      .gte('data_coleta', desde)
      .order('data_coleta')
      .range(inicio, inicio + TAMANHO_PAGINA - 1)
    if (error) throw erroConsulta('as expectativas do Focus')
    const linhas = data ?? []
    expectativas.push(
      ...linhas.map((l) => ({
        indicador: l.indicador,
        referencia: l.referencia,
        dataColeta: l.data_coleta,
        mediana: String(l.mediana),
      })),
    )
    if (linhas.length < TAMANHO_PAGINA) return expectativas
  }
}

export async function carregarRegras(supabase: SupabaseClient): Promise<RegraAlerta[]> {
  const { data, error } = await supabase
    .from('regras_alerta')
    .select('codigo, descricao, limite, limite_secundario, severidade, ativa')
    .order('codigo')
  if (error) throw erroConsulta('as regras de alerta')
  return (data ?? []).map((r) => ({
    codigo: r.codigo,
    descricao: r.descricao,
    limite: r.limite === null ? null : String(r.limite),
    limiteSecundario: r.limite_secundario === null ? null : String(r.limite_secundario),
    severidade: r.severidade,
    ativa: r.ativa,
  }))
}

/** Data e hora da última carga feita pelo script de indicadores. */
export async function carregarUltimaAtualizacao(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from('indicador_valores')
    .select('atualizado_em')
    .order('atualizado_em', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw erroConsulta('a data de atualização')
  return data?.atualizado_em ?? null
}

export interface DadosPainel {
  dados: DadosAnalise
  referencia: DataISO
  atualizadoEm: string | null
}

/** Tudo o que os painéis e o assistente precisam para o período filtrado. */
export async function carregarDadosPainel(supabase: SupabaseClient, filtros: Filtros, hoje: DataISO): Promise<DadosPainel> {
  const referencia = dataDeReferencia(filtros, hoje)
  const desdeCalculado = primeiroDia(somarMeses(filtros.inicio, -MESES_HISTORICO))
  const desde = desdeCalculado < INICIO_DADOS ? INICIO_DADOS : desdeCalculado
  const semDolar = CODIGOS_INDICADORES.filter((c) => c !== 'USD')
  const [series, dolar, metas, expectativas, atualizadoEm] = await Promise.all([
    carregarSeries(supabase, semDolar, desde, referencia),
    // Dólar com todo o histórico: o insight "maior alta desde" procura até 2015.
    carregarSeries(supabase, ['USD'], INICIO_DADOS, referencia),
    carregarMetas(supabase),
    carregarExpectativas(supabase, desde),
    carregarUltimaAtualizacao(supabase),
  ])
  return { dados: { series: { ...series, ...dolar }, metas, expectativas }, referencia, atualizadoEm }
}
