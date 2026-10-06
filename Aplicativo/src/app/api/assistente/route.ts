import { z } from 'zod'
import { autorizarApi } from '@/lib/auth/sessao'
import { kpisTermometro } from '@/lib/dominio/resumo'
import { montarContextoAssistente } from '@/lib/gemini/contexto'
import { TAMANHO_MAXIMO_PERGUNTA } from '@/lib/gemini/limites'
import { responderPergunta } from '@/lib/gemini/assistente'
import { respostaDeErro, respostaJson } from '@/lib/servicos/erros-api'
import { criarLimitador } from '@/lib/servicos/limite-taxa'
import { carregarContextoPagina } from '@/lib/servicos/pagina'

export const maxDuration = 60

const PERGUNTAS_POR_MINUTO = 10
const permitir = criarLimitador(PERGUNTAS_POR_MINUTO, 60_000)

const esquema = z.object({
  pergunta: z.string().trim().min(3).max(TAMANHO_MAXIMO_PERGUNTA),
  // Filtros da tela como query string; são revalidados no servidor pelo mesmo leitor das páginas.
  busca: z.string().max(500).default(''),
})

export async function POST(request: Request) {
  const autorizacao = await autorizarApi()
  if (!autorizacao.ok) return autorizacao.resposta

  const corpo = esquema.safeParse(await request.json().catch(() => null))
  if (!corpo.success) return respostaJson({ erro: `Escreva uma pergunta de 3 a ${TAMANHO_MAXIMO_PERGUNTA} caracteres.` }, 400)
  if (!permitir(autorizacao.sessao.userId)) {
    return respostaJson({ erro: 'Muitas perguntas em pouco tempo. Aguarde um minuto.' }, 429)
  }

  try {
    const busca = new URLSearchParams(corpo.data.busca)
    const parametros = Object.fromEntries([...new Set(busca.keys())].map((k) => [k, busca.getAll(k)]))
    const ctx = await carregarContextoPagina(parametros)
    const contexto = montarContextoAssistente(ctx.dados, ctx.filtros, ctx.referencia, kpisTermometro(ctx.dados, ctx.referencia), ctx.insights)
    const resposta = await responderPergunta(corpo.data.pergunta, contexto)
    return respostaJson({ resposta, periodo: { inicio: ctx.filtros.inicio, fim: ctx.filtros.fim } })
  } catch (erro) {
    return respostaDeErro(erro, 'assistente')
  }
}
