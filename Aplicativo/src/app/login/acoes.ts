'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { urlDoSite } from '@/lib/env'
import {
  camposDoFormulario,
  esquemaCadastro,
  esquemaEntrar,
  esquemaRecuperar,
  MENSAGEM_SENHA_FRACA,
  primeiraMensagem,
  type EstadoFormulario,
} from '@/lib/auth/validacao'
import { criarLimitador } from '@/lib/servicos/limite-taxa'
import { criarClienteServidor } from '@/lib/supabase/servidor'

// Limites por instância (o Supabase vê só o IP da Vercel, então o limite por IP do usuário fica aqui).
const QUINZE_MINUTOS = 15 * 60 * 1000
const UMA_HORA = 60 * 60 * 1000
// Por IP o limite é maior: várias pessoas podem sair pelo mesmo IP (rede do escritório).
const permitirLoginPorIp = criarLimitador(20, QUINZE_MINUTOS)
const permitirLoginPorEmail = criarLimitador(5, QUINZE_MINUTOS)
const permitirCadastro = criarLimitador(5, UMA_HORA)
const permitirRecuperacao = criarLimitador(3, UMA_HORA)

const ERRO_LOGIN = 'E-mail ou senha inválidos.'
const ERRO_LIMITE = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
const ERRO_INESPERADO = 'Não foi possível concluir agora. Tente novamente em instantes.'
const CADASTRO_ENVIADO =
  'Enviamos um link de confirmação para o seu e-mail. Depois de confirmar, um administrador vai liberar seu acesso.'
const RECUPERACAO_ENVIADA = 'Se houver uma conta com esse e-mail, você vai receber um link para criar uma nova senha.'

/** IP do visitante. Na Vercel, `x-real-ip` é definido pela plataforma (não pelo navegador). */
async function ipDoCliente(): Promise<string> {
  const cabecalhos = await headers()
  return cabecalhos.get('x-real-ip')?.trim() || cabecalhos.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido'
}

/** Login com e-mail e senha (usuários e administrador). O papel é decidido depois, pela sessão. */
export async function entrar(_estado: EstadoFormulario, formulario: FormData): Promise<EstadoFormulario> {
  const dados = esquemaEntrar.safeParse(camposDoFormulario(formulario, ['email', 'senha']))
  if (!dados.success) return { erro: ERRO_LOGIN, sucesso: null }
  const ip = await ipDoCliente()
  if (!permitirLoginPorIp(ip) || !permitirLoginPorEmail(dados.data.email)) {
    return { erro: ERRO_LIMITE, sucesso: null }
  }

  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.signInWithPassword({ email: dados.data.email, password: dados.data.senha })
  if (error) {
    // Só chega aqui com a senha certa: avisar não revela a existência da conta a quem não a conhece.
    if (error.code === 'email_not_confirmed') {
      return { erro: 'Confirme seu e-mail pelo link que enviamos antes de entrar.', sucesso: null }
    }
    return { erro: ERRO_LOGIN, sucesso: null }
  }

  const { error: erroAcesso } = await supabase.rpc('registrar_acesso')
  if (erroAcesso) console.error('[login] Falha ao registrar acesso', erroAcesso.code)
  redirect('/')
}

/** Cadastro com e-mail e senha. A conta nasce pendente e só acessa o portal após aprovação do admin. */
export async function cadastrar(_estado: EstadoFormulario, formulario: FormData): Promise<EstadoFormulario> {
  const dados = esquemaCadastro.safeParse(camposDoFormulario(formulario, ['nome', 'email', 'senha', 'confirmacao']))
  if (!dados.success) return { erro: primeiraMensagem(dados.error, 'Informe um e-mail válido.'), sucesso: null }
  if (!permitirCadastro(`ip:${await ipDoCliente()}`)) return { erro: ERRO_LIMITE, sucesso: null }

  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.signUp({
    email: dados.data.email,
    password: dados.data.senha,
    options: { emailRedirectTo: urlDoSite('/auth/confirmar'), data: { nome: dados.data.nome } },
  })
  if (error) {
    if (error.code === 'weak_password') {
      return { erro: MENSAGEM_SENHA_FRACA, sucesso: null }
    }
    if (error.code === 'over_email_send_rate_limit' || error.status === 429) return { erro: ERRO_LIMITE, sucesso: null }
    // E-mail já cadastrado também cai aqui em algumas configurações: mesma resposta de sucesso
    // para não revelar quem tem conta.
    if (error.code === 'user_already_exists' || error.code === 'email_exists') return { erro: null, sucesso: CADASTRO_ENVIADO }
    console.error('[cadastro] Falha no cadastro', error.code ?? error.status)
    return { erro: ERRO_INESPERADO, sucesso: null }
  }
  return { erro: null, sucesso: CADASTRO_ENVIADO }
}

/** Envia o link de nova senha. A resposta é sempre a mesma, exista ou não a conta. */
export async function recuperarSenha(_estado: EstadoFormulario, formulario: FormData): Promise<EstadoFormulario> {
  const dados = esquemaRecuperar.safeParse(camposDoFormulario(formulario, ['email']))
  if (!dados.success) return { erro: 'Informe um e-mail válido.', sucesso: null }
  const ip = await ipDoCliente()
  if (!permitirRecuperacao(`ip:${ip}`) || !permitirRecuperacao(`email:${dados.data.email}`)) {
    return { erro: ERRO_LIMITE, sucesso: null }
  }

  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.resetPasswordForEmail(dados.data.email, {
    // `type` garante o destino certo também no modelo de e-mail padrão (link com `code`).
    redirectTo: urlDoSite('/auth/confirmar?type=recovery'),
  })
  if (error) console.error('[recuperar-senha] Falha ao enviar o link', error.code ?? error.status)
  return { erro: null, sucesso: RECUPERACAO_ENVIADA }
}
