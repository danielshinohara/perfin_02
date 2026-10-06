import type { CodigoRegra, Insight, RegraAlerta } from '../tipos'
import { ordenarInsights, type AvaliadorRegra, type ContextoInsights } from './contexto'
import { inflacaoAcelerando, ipcaForaDaMeta, spreadIgpmIpca } from './regras-inflacao'
import { atividadeDesacelera, cdiReal, dolarMovimento, dolarVolatilidade, focusRevisoes, juroReal } from './regras-mercado'
import { maioresVariacoes } from './regras-periodo'

const AVALIADORES: Record<CodigoRegra, AvaliadorRegra> = {
  IPCA_FORA_META: ipcaForaDaMeta,
  INFLACAO_ACELERANDO: inflacaoAcelerando,
  JURO_REAL: juroReal,
  SPREAD_IGPM_IPCA: spreadIgpmIpca,
  DOLAR_MOVIMENTO: dolarMovimento,
  DOLAR_VOLATILIDADE: dolarVolatilidade,
  FOCUS_REVISOES: focusRevisoes,
  CDI_REAL: cdiReal,
  ATIVIDADE_DESACELERA: atividadeDesacelera,
  MAIORES_VARIACOES: maioresVariacoes,
}

/** Avalia as regras ativas e devolve os insights ordenados (alertas primeiro). */
export function gerarInsights(ctx: ContextoInsights, regras: RegraAlerta[]): Insight[] {
  const insights = regras
    .filter((r) => r.ativa)
    .map((r) => AVALIADORES[r.codigo](ctx, r))
    .filter((i): i is Insight => i !== null)
  return ordenarInsights(insights)
}

/** Regras usadas no site público: só informativas e só com indicadores públicos. */
const REGRAS_PUBLICAS: RegraAlerta[] = [
  { codigo: 'IPCA_FORA_META', descricao: '', limite: null, limiteSecundario: null, severidade: 'informativo', ativa: true },
  { codigo: 'CDI_REAL', descricao: '', limite: null, limiteSecundario: null, severidade: 'informativo', ativa: true },
  { codigo: 'MAIORES_VARIACOES', descricao: '', limite: null, limiteSecundario: null, severidade: 'informativo', ativa: true },
]

export function gerarInsightsPublicos(ctx: ContextoInsights): Insight[] {
  return gerarInsights(ctx, REGRAS_PUBLICAS).map((i) => ({ ...i, severidade: 'informativo', ehAlerta: false }))
}
