import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { envServidor } from '@/lib/env'
import { criarClienteServidor } from '@/lib/supabase/servidor'
import { metodoDeLogin, papelDaSessao, type MetodoLogin, type Papel } from './papel'

export interface Sessao {
  userId: string
  email: string
  nome: string | null
  papel: Papel
  metodo: MetodoLogin
  bloqueado: boolean
}

/** Sessão validada no servidor (assinatura e expiração do JWT) + situação do perfil. */
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await criarClienteServidor()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) return null
  const claims = data.claims

  const [{ data: perfil, error: erroPerfil }, { data: adminNoBanco, error: erroAdmin }] = await Promise.all([
    supabase.from('perfis').select('nome, bloqueado').eq('user_id', claims.sub).maybeSingle(),
    supabase.rpc('eh_admin'),
  ])
  if (erroPerfil || erroAdmin) throw new Error('Não foi possível carregar o perfil do usuário')
  // Admin só quando o app (ADMIN_USUARIO + login por senha) e o banco (tabela administradores, usada
  // pelo RLS) concordam; assim a interface nunca mostra telas que o banco vai negar.
  const papelApp = papelDaSessao(claims.email, claims.amr, envServidor().ADMIN_USUARIO)

  return {
    userId: claims.sub,
    email: claims.email ?? '',
    nome: perfil?.nome ?? null,
    papel: papelApp === 'admin' && adminNoBanco === true ? 'admin' : 'usuario',
    metodo: metodoDeLogin(claims.amr),
    // Sem perfil = não autorizado (nega por padrão).
    bloqueado: perfil ? perfil.bloqueado : true,
  }
})

export async function exigirUsuario(): Promise<Sessao> {
  const sessao = await obterSessao()
  if (!sessao) redirect('/login')
  if (sessao.bloqueado) redirect('/acesso-negado')
  return sessao
}

export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await exigirUsuario()
  if (sessao.papel !== 'admin') redirect('/')
  return sessao
}

export type ResultadoAutorizacao = { ok: true; sessao: Sessao } | { ok: false; resposta: Response }

function erroJson(mensagem: string, status: number): Response {
  return Response.json({ erro: mensagem }, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** Para Route Handlers: devolve a sessão ou a resposta de erro (401/403) pronta. */
export async function autorizarApi(exigirGoogle = false): Promise<ResultadoAutorizacao> {
  const sessao = await obterSessao()
  if (!sessao) return { ok: false, resposta: erroJson('Sessão expirada. Entre novamente.', 401) }
  if (sessao.bloqueado) return { ok: false, resposta: erroJson('Acesso não autorizado.', 403) }
  if (exigirGoogle && sessao.metodo !== 'google') {
    return { ok: false, resposta: erroJson('Entre com Google para usar este recurso.', 403) }
  }
  return { ok: true, sessao }
}
