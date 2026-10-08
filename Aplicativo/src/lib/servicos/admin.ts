import 'server-only'
import { cache } from 'react'
import { lerSituacao, type Situacao } from '@/lib/auth/validacao'
import { criarClienteServidor, type ClienteSupabase } from '@/lib/supabase/servidor'

export interface UsuarioPortal {
  userId: string
  email: string
  nome: string | null
  situacao: Situacao
  provedor: 'google' | 'email' | null
  emailConfirmado: boolean
  criadoEm: string
  ultimoAcessoEm: string | null
}

/** Lista os perfis (o RLS só libera todos para o admin logado com senha). */
export async function listarUsuarios(supabase: ClienteSupabase): Promise<UsuarioPortal[]> {
  const { data, error } = await supabase
    .from('perfis')
    .select('user_id, email, nome, situacao, provedor, email_confirmado_em, criado_em, ultimo_acesso_em')
    .order('criado_em', { ascending: false })
  if (error) throw new Error('Não foi possível carregar os usuários')
  return (data ?? []).map((p) => ({
    userId: p.user_id,
    email: p.email,
    nome: p.nome,
    situacao: lerSituacao(p.situacao),
    provedor: p.provedor === 'google' || p.provedor === 'email' ? p.provedor : null,
    emailConfirmado: p.email_confirmado_em !== null,
    criadoEm: p.criado_em,
    ultimoAcessoEm: p.ultimo_acesso_em,
  }))
}

/** Cadastros aguardando aprovação (selo do menu do admin); uma consulta por requisição. */
export const contarPendentes = cache(async (): Promise<number> => {
  const supabase = await criarClienteServidor()
  const { count, error } = await supabase.from('perfis').select('user_id', { count: 'exact', head: true }).eq('situacao', 'pendente')
  if (error) throw new Error('Não foi possível contar os cadastros pendentes')
  return count ?? 0
})

/** Aprova, bloqueia ou desbloqueia (função do banco que exige admin e registra quem alterou). */
export async function definirSituacao(
  supabase: ClienteSupabase,
  userId: string,
  situacao: Exclude<Situacao, 'pendente'>,
): Promise<void> {
  const { error } = await supabase.rpc('definir_situacao_usuario', { p_user_id: userId, p_situacao: situacao })
  if (error) throw new Error('Não foi possível alterar o acesso do usuário')
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
