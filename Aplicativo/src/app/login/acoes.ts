'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { criarLimitador } from '@/lib/servicos/limite-taxa'
import { criarClienteServidor } from '@/lib/supabase/servidor'

// 5 tentativas a cada 15 minutos por IP e por e-mail (o Supabase vê só o IP da Vercel).
const permitirTentativa = criarLimitador(5, 15 * 60 * 1000)

export interface EstadoLoginAdmin {
  erro: string | null
}

const esquema = z.object({
  email: z.email().max(254),
  senha: z.string().min(1).max(200),
})

const ERRO_GENERICO = 'E-mail ou senha inválidos.'

/** Login do administrador (e-mail e senha guardados com hash no Supabase Auth). */
export async function entrarComoAdmin(_estado: EstadoLoginAdmin, formulario: FormData): Promise<EstadoLoginAdmin> {
  const dados = esquema.safeParse({ email: formulario.get('email'), senha: formulario.get('senha') })
  if (!dados.success) return { erro: ERRO_GENERICO }
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconhecido'
  if (!permitirTentativa(`ip:${ip}`) || !permitirTentativa(`email:${dados.data.email.toLowerCase()}`)) {
    return { erro: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' }
  }

  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.signInWithPassword({ email: dados.data.email, password: dados.data.senha })
  // Mensagem única para não revelar se o e-mail existe.
  if (error) return { erro: ERRO_GENERICO }

  const { error: erroAcesso } = await supabase.rpc('registrar_acesso')
  if (erroAcesso) console.error('[login-admin] Falha ao registrar acesso', erroAcesso.code)
  redirect('/')
}
