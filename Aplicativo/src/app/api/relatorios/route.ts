import { autorizarApi } from '@/lib/auth/sessao'
import { hojeEmSaoPaulo } from '@/lib/dominio/datas'
import { validarMesRelatorio } from '@/lib/dominio/periodo'
import { respostaDeErro, respostaJson } from '@/lib/servicos/erros-api'
import { gerarRelatorio } from '@/lib/servicos/relatorios'
import { criarClienteServidor } from '@/lib/supabase/servidor'

export const maxDuration = 60

/** Gera a Planilha Google do mês no Drive do usuário. Corpo: `{ "mes": "AAAA-MM" }`. */
export async function POST(request: Request) {
  const autorizacao = await autorizarApi(true)
  if (!autorizacao.ok) return autorizacao.resposta

  const corpo = (await request.json().catch(() => null)) as { mes?: unknown } | null
  const hoje = hojeEmSaoPaulo()
  const mes = validarMesRelatorio(corpo?.mes, hoje)
  if (!mes) return respostaJson({ erro: 'Mês inválido. Use um mês entre 01/2016 e o mês atual.' }, 400)

  try {
    const supabase = await criarClienteServidor()
    const relatorio = await gerarRelatorio(supabase, autorizacao.sessao.userId, mes, hoje)
    return respostaJson({ relatorio }, 201)
  } catch (erro) {
    return respostaDeErro(erro, 'gerar-relatorio')
  }
}
