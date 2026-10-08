import { NextResponse, type NextRequest } from 'next/server'
import { urlDoSite } from '@/lib/env'
import { tipoDeLink, type TipoLinkEmail } from '@/lib/auth/validacao'
import { criarClienteServidor } from '@/lib/supabase/servidor'

/**
 * Links enviados por e-mail (confirmação de cadastro e nova senha).
 * - GET com `token_hash` + `type` (modelo de e-mail recomendado): não consome o token; leva à página
 *   /conta/confirmar, onde a pessoa clica em um botão. Assim, antivírus de e-mail que abrem links
 *   sozinhos não invalidam o link antes do usuário.
 * - POST com `token_hash` + `type`: vindo dessa página, valida o token e abre a sessão.
 * - GET com `code`: modelo padrão do Supabase (fluxo PKCE); funciona no mesmo navegador do cadastro.
 */
export async function GET(request: NextRequest) {
  const parametros = request.nextUrl.searchParams
  const tokenHash = parametros.get('token_hash')
  const tipo = tipoDeLink(parametros.get('type'))
  if (tokenHash && tipo) {
    const destino = new URLSearchParams({ token_hash: tokenHash, type: tipo })
    return NextResponse.redirect(urlDoSite(`/conta/confirmar?${destino.toString()}`))
  }

  const codigo = parametros.get('code')
  if (!codigo) return NextResponse.redirect(urlDoSite('/login?erro=link'))
  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.exchangeCodeForSession(codigo)
  // Link aberto em outro navegador: o e-mail pode já estar confirmado, só a sessão não abriu.
  if (error) return NextResponse.redirect(urlDoSite('/login?erro=link-outro-navegador'))
  return concluir(supabase, tipo)
}

export async function POST(request: NextRequest) {
  // Só aceita o formulário da própria página (evita que outro site abra uma sessão no navegador da vítima).
  if (request.headers.get('origin') !== new URL(urlDoSite('/')).origin) {
    return NextResponse.redirect(urlDoSite('/login?erro=link'), 303)
  }
  const formulario = await request.formData()
  const tokenHash = formulario.get('token_hash')
  const tipoInformado = formulario.get('type')
  const tipo = tipoDeLink(typeof tipoInformado === 'string' ? tipoInformado : null)
  if (typeof tokenHash !== 'string' || !tokenHash || !tipo) return NextResponse.redirect(urlDoSite('/login?erro=link'), 303)

  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo })
  if (error) return NextResponse.redirect(urlDoSite('/login?erro=link'), 303)
  return concluir(supabase, tipo, 303)
}

async function concluir(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  tipo: TipoLinkEmail | null,
  status?: number,
): Promise<NextResponse> {
  if (tipo === 'recovery') return NextResponse.redirect(urlDoSite('/conta/nova-senha'), status)
  const { error: erroAcesso } = await supabase.rpc('registrar_acesso')
  if (erroAcesso) console.error('[auth-confirmar] Falha ao registrar acesso', erroAcesso.code)
  return NextResponse.redirect(urlDoSite('/'), status)
}
