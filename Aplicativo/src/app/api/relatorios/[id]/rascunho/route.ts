import { z } from 'zod'
import { autorizarApi } from '@/lib/auth/sessao'
import { hojeEmSaoPaulo } from '@/lib/dominio/datas'
import { LINK_RASCUNHOS } from '@/lib/google/gmail'
import { respostaDeErro, respostaJson } from '@/lib/servicos/erros-api'
import { criarRascunhoDoRelatorio } from '@/lib/servicos/relatorios'
import { criarClienteServidor } from '@/lib/supabase/servidor'

export const maxDuration = 60

/** Cria um RASCUNHO no Gmail com o relatório anexado. O e-mail nunca é enviado pelo portal. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const autorizacao = await autorizarApi(true)
  if (!autorizacao.ok) return autorizacao.resposta
  const id = z.uuid().safeParse((await params).id)
  if (!id.success) return respostaJson({ erro: 'Relatório inválido.' }, 400)

  try {
    const supabase = await criarClienteServidor()
    const rascunhoId = await criarRascunhoDoRelatorio(supabase, autorizacao.sessao.userId, id.data, hojeEmSaoPaulo())
    return respostaJson({ rascunhoId, link: LINK_RASCUNHOS }, 201)
  } catch (erro) {
    return respostaDeErro(erro, 'criar-rascunho')
  }
}
