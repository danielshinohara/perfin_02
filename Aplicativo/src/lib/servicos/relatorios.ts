import 'server-only'
import { somarMeses, ultimoDia } from '@/lib/dominio/datas'
import { gerarInsights } from '@/lib/dominio/insights/gerar'
import { montarConteudoRelatorio, textoDoRascunho } from '@/lib/dominio/relatorio'
import { resumoMensal, type ResumoMensal } from '@/lib/dominio/resumo-mensal'
import { CODIGOS_INDICADORES, type DataISO, type Insight, type Mes } from '@/lib/dominio/tipos'
import { formatarMesAno } from '@/lib/dominio/formatos'
import { exportarXlsx, MIME_XLSX } from '@/lib/google/drive'
import { criarRascunho } from '@/lib/google/gmail'
import { criarPlanilha } from '@/lib/google/sheets'
import type { ClienteSupabase } from '@/lib/supabase/servidor'
import { obterAccessToken } from './google-tokens'
import { carregarDadosPainel, carregarRegras } from './indicadores'

export interface Relatorio {
  id: string
  mesReferencia: Mes
  planilhaUrl: string
  planilhaId: string
  rascunhoGmailId: string | null
  criadoEm: string
}

export class RelatorioNaoEncontradoError extends Error {}

interface LinhaRelatorio {
  id: string
  mes_referencia: string
  planilha_id: string
  planilha_url: string
  rascunho_gmail_id: string | null
  criado_em: string
}

/** Só aceita links do Google Docs (o link vira href na interface). */
function linkSeguroDaPlanilha(url: string): string {
  return url.startsWith('https://docs.google.com/') ? url : 'https://docs.google.com/spreadsheets/'
}

function converter(l: LinhaRelatorio): Relatorio {
  return {
    id: l.id,
    mesReferencia: l.mes_referencia.slice(0, 7),
    planilhaId: l.planilha_id,
    planilhaUrl: linkSeguroDaPlanilha(l.planilha_url),
    rascunhoGmailId: l.rascunho_gmail_id,
    criadoEm: l.criado_em,
  }
}

const COLUNAS = 'id, mes_referencia, planilha_id, planilha_url, rascunho_gmail_id, criado_em'

async function analisarMes(supabase: ClienteSupabase, mes: Mes, hoje: DataISO): Promise<{ resumo: ResumoMensal; insights: Insight[]; painel: Awaited<ReturnType<typeof carregarDadosPainel>> }> {
  const filtros = { inicio: somarMeses(mes, -23), fim: mes, indicadores: [...CODIGOS_INDICADORES] }
  const [painel, regras] = await Promise.all([carregarDadosPainel(supabase, filtros, hoje), carregarRegras(supabase)])
  const referencia = ultimoDia(mes) < hoje ? ultimoDia(mes) : hoje
  const insights = gerarInsights({ dados: painel.dados, referencia, filtros }, regras)
  return { resumo: resumoMensal(painel.dados, mes), insights, painel }
}

/** Gera a Planilha do mês no Drive do usuário e registra no histórico. */
export async function gerarRelatorio(supabase: ClienteSupabase, userId: string, mes: Mes, hoje: DataISO): Promise<Relatorio> {
  const { resumo, insights, painel } = await analisarMes(supabase, mes, hoje)
  const accessToken = await obterAccessToken(supabase, userId)
  const planilha = await criarPlanilha(accessToken, montarConteudoRelatorio(resumo, insights, painel.dados))
  const { data, error } = await supabase
    .from('relatorios')
    .insert({ user_id: userId, mes_referencia: `${mes}-01`, planilha_id: planilha.id, planilha_url: planilha.url })
    .select(COLUNAS)
    .single()
  if (error || !data) throw new Error('A planilha foi criada, mas não foi possível registrá-la no histórico')
  return converter(data as LinhaRelatorio)
}

export async function listarRelatorios(supabase: ClienteSupabase, userId: string): Promise<Relatorio[]> {
  const { data, error } = await supabase
    .from('relatorios')
    .select(COLUNAS)
    .eq('user_id', userId)
    .order('criado_em', { ascending: false })
    .limit(24)
  if (error) throw new Error('Não foi possível carregar o histórico de relatórios')
  return ((data ?? []) as LinhaRelatorio[]).map(converter)
}

async function buscarRelatorio(supabase: ClienteSupabase, userId: string, id: string): Promise<Relatorio> {
  const { data, error } = await supabase.from('relatorios').select(COLUNAS).eq('id', id).eq('user_id', userId).maybeSingle()
  if (error) throw new Error('Não foi possível carregar o relatório')
  if (!data) throw new RelatorioNaoEncontradoError('Relatório não encontrado')
  return converter(data as LinhaRelatorio)
}

export function nomeArquivoXlsx(mes: Mes): string {
  return `relatorio-indicadores-${mes}.xlsx`
}

export async function baixarXlsx(supabase: ClienteSupabase, userId: string, id: string): Promise<{ nome: string; conteudo: ArrayBuffer }> {
  const relatorio = await buscarRelatorio(supabase, userId, id)
  const accessToken = await obterAccessToken(supabase, userId)
  return { nome: nomeArquivoXlsx(relatorio.mesReferencia), conteudo: await exportarXlsx(accessToken, relatorio.planilhaId) }
}

/** Cria um RASCUNHO no Gmail com o .xlsx anexado. Nunca envia: o usuário revisa e envia pelo Gmail. */
export async function criarRascunhoDoRelatorio(supabase: ClienteSupabase, userId: string, id: string, hoje: DataISO): Promise<string> {
  const relatorio = await buscarRelatorio(supabase, userId, id)
  const [{ resumo, insights }, accessToken] = await Promise.all([
    analisarMes(supabase, relatorio.mesReferencia, hoje),
    obterAccessToken(supabase, userId),
  ])
  const xlsx = await exportarXlsx(accessToken, relatorio.planilhaId)
  const { assunto, corpo } = textoDoRascunho(resumo, insights)
  const rascunhoId = await criarRascunho(accessToken, {
    assunto,
    corpo: `${corpo}\n\nPlanilha no Google Drive: ${relatorio.planilhaUrl}`,
    anexo: { nome: nomeArquivoXlsx(relatorio.mesReferencia), tipo: MIME_XLSX, conteudo: new Uint8Array(xlsx) },
  })
  const { error } = await supabase.from('relatorios').update({ rascunho_gmail_id: rascunhoId }).eq('id', id).eq('user_id', userId)
  if (error) throw new Error(`Rascunho criado no Gmail (${formatarMesAno(relatorio.mesReferencia)}), mas o histórico não foi atualizado`)
  return rascunhoId
}
