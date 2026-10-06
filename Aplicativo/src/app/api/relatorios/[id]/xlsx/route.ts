import { z } from 'zod'
import { autorizarApi } from '@/lib/auth/sessao'
import { MIME_XLSX } from '@/lib/google/drive'
import { respostaDeErro, respostaJson } from '@/lib/servicos/erros-api'
import { baixarXlsx } from '@/lib/servicos/relatorios'
import { criarClienteServidor } from '@/lib/supabase/servidor'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const autorizacao = await autorizarApi(true)
  if (!autorizacao.ok) return autorizacao.resposta
  const id = z.uuid().safeParse((await params).id)
  if (!id.success) return respostaJson({ erro: 'Relatório inválido.' }, 400)

  try {
    const supabase = await criarClienteServidor()
    const arquivo = await baixarXlsx(supabase, autorizacao.sessao.userId, id.data)
    return new Response(arquivo.conteudo, {
      headers: {
        'Content-Type': MIME_XLSX,
        'Content-Disposition': `attachment; filename="${arquivo.nome}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (erro) {
    return respostaDeErro(erro, 'baixar-xlsx')
  }
}
