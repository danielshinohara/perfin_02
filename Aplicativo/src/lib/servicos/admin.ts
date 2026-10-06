import 'server-only'
import type { ClienteSupabase } from '@/lib/supabase/servidor'

export interface UsuarioPortal {
  userId: string
  email: string
  nome: string | null
  bloqueado: boolean
  criadoEm: string
  ultimoAcessoEm: string | null
}

/** Lista os perfis (o RLS só libera todos para o admin logado com senha). */
export async function listarUsuarios(supabase: ClienteSupabase): Promise<UsuarioPortal[]> {
  const { data, error } = await supabase
    .from('perfis')
    .select('user_id, email, nome, bloqueado, criado_em, ultimo_acesso_em')
    .order('ultimo_acesso_em', { ascending: false, nullsFirst: false })
  if (error) throw new Error('Não foi possível carregar os usuários')
  return (data ?? []).map((p) => ({
    userId: p.user_id,
    email: p.email,
    nome: p.nome,
    bloqueado: p.bloqueado,
    criadoEm: p.criado_em,
    ultimoAcessoEm: p.ultimo_acesso_em,
  }))
}

export async function alterarBloqueio(supabase: ClienteSupabase, userId: string, bloqueado: boolean): Promise<void> {
  const { data, error } = await supabase.from('perfis').update({ bloqueado }).eq('user_id', userId).select('user_id')
  if (error || !data?.length) throw new Error('Não foi possível alterar o acesso do usuário')
}

export interface AlteracaoRegra {
  codigo: string
  limite: string | null
  limiteSecundario: string | null
  severidade: 'informativo' | 'atencao' | 'alerta'
  ativa: boolean
}

export async function atualizarRegra(supabase: ClienteSupabase, alteracao: AlteracaoRegra): Promise<void> {
  const { data, error } = await supabase
    .from('regras_alerta')
    .update({
      limite: alteracao.limite,
      limite_secundario: alteracao.limiteSecundario,
      severidade: alteracao.severidade,
      ativa: alteracao.ativa,
    })
    .eq('codigo', alteracao.codigo)
    .select('codigo')
  if (error || !data?.length) throw new Error('Não foi possível salvar a regra')
}
