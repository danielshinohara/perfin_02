import 'server-only'
import { AssistenteIndisponivelError } from '@/lib/gemini/assistente'
import { GoogleApiError, GoogleReconectarError } from '@/lib/google/http'
import { RelatorioNaoEncontradoError } from './relatorios'

const SEM_CACHE = { 'Cache-Control': 'no-store' }

export function respostaJson(corpo: unknown, status = 200): Response {
  return Response.json(corpo, { status, headers: SEM_CACHE })
}

/** Converte erros conhecidos em respostas seguras (sem detalhes internos, tokens ou chaves). */
export function respostaDeErro(erro: unknown, contexto: string): Response {
  if (erro instanceof GoogleReconectarError) return respostaJson({ erro: erro.message, reconectar: true }, 409)
  if (erro instanceof RelatorioNaoEncontradoError) return respostaJson({ erro: 'Relatório não encontrado.' }, 404)
  if (erro instanceof AssistenteIndisponivelError) return respostaJson({ erro: erro.message }, 503)
  if (erro instanceof GoogleApiError && erro.status === 403) {
    return respostaJson({ erro: 'O Google negou a permissão. Entre novamente com Google e aceite os acessos pedidos.', reconectar: true }, 409)
  }
  console.error(`[${contexto}]`, erro instanceof Error ? erro.message : 'erro desconhecido')
  return respostaJson({ erro: 'Não foi possível concluir a operação. Tente novamente em instantes.' }, 500)
}
