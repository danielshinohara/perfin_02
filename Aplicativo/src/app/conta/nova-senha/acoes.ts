'use server'

import { redirect } from 'next/navigation'
import { emailDaSessaoDeRecuperacao } from '@/lib/auth/sessao'
import {
  camposDoFormulario,
  esquemaNovaSenha,
  MENSAGEM_SENHA_FRACA,
  primeiraMensagem,
  type EstadoFormulario,
} from '@/lib/auth/validacao'
import { criarClienteServidor } from '@/lib/supabase/servidor'

/** Define a nova senha de quem chegou pelo link de recuperação (sessão recente aberta pelo link). */
export async function definirNovaSenha(_estado: EstadoFormulario, formulario: FormData): Promise<EstadoFormulario> {
  const dados = esquemaNovaSenha.safeParse(camposDoFormulario(formulario, ['senha', 'confirmacao']))
  if (!dados.success) return { erro: primeiraMensagem(dados.error, 'Senha inválida.'), sucesso: null }
  if ((await emailDaSessaoDeRecuperacao()) === null) redirect('/login?erro=link')

  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.updateUser({ password: dados.data.senha })
  if (error) {
    if (error.code === 'weak_password') return { erro: MENSAGEM_SENHA_FRACA, sucesso: null }
    if (error.code === 'same_password') return { erro: 'Escolha uma senha diferente da anterior.', sucesso: null }
    console.error('[nova-senha] Falha ao alterar a senha', error.code ?? error.status)
    return { erro: 'Não foi possível alterar a senha. Peça um novo link.', sucesso: null }
  }
  redirect('/')
}
