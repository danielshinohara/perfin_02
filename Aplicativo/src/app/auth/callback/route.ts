import { NextResponse, type NextRequest } from 'next/server'
import { urlDoSite } from '@/lib/env'
import { salvarRefreshToken } from '@/lib/servicos/google-tokens'
import { criarClienteServidor } from '@/lib/supabase/servidor'

/** Retorno do Google: troca o código pela sessão e guarda o refresh token criptografado. */
export async function GET(request: NextRequest) {
  const parametros = request.nextUrl.searchParams
  if (parametros.get('error')) return NextResponse.redirect(urlDoSite('/login?erro=cancelado'))
  const codigo = parametros.get('code')
  if (!codigo) return NextResponse.redirect(urlDoSite('/login?erro=google'))

  const supabase = await criarClienteServidor()
  const { data, error } = await supabase.auth.exchangeCodeForSession(codigo)
  if (error || !data.session) return NextResponse.redirect(urlDoSite('/login?erro=google'))

  const refreshToken = data.session.provider_refresh_token
  if (refreshToken) {
    try {
      await salvarRefreshToken(supabase, data.session.user.id, refreshToken)
    } catch (erro) {
      // Usuário bloqueado (RLS nega) ou falha de banco: o login segue e a tela trata o acesso.
      console.error('Falha ao salvar a conexão Google', erro instanceof Error ? erro.message : 'erro desconhecido')
    }
  }
  const { error: erroAcesso } = await supabase.rpc('registrar_acesso')
  if (erroAcesso) console.error('[auth-callback] Falha ao registrar acesso', erroAcesso.code)
  return NextResponse.redirect(urlDoSite('/'))
}
