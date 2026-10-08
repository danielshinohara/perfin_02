'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirAdmin } from '@/lib/auth/sessao'
import { definirSituacao } from '@/lib/servicos/admin'
import { criarClienteServidor } from '@/lib/supabase/servidor'

const esquema = z.object({ userId: z.uuid(), situacao: z.enum(['ativo', 'bloqueado']) })

/** Aprovar, recusar, bloquear ou desbloquear um usuário. */
export async function alterarSituacao(formulario: FormData): Promise<void> {
  const sessao = await exigirAdmin()
  const dados = esquema.safeParse({ userId: formulario.get('userId'), situacao: formulario.get('situacao') })
  if (!dados.success) throw new Error('Dados inválidos')
  if (dados.data.userId === sessao.userId) throw new Error('Você não pode alterar o próprio acesso')
  await definirSituacao(await criarClienteServidor(), dados.data.userId, dados.data.situacao)
  revalidatePath('/admin/usuarios')
  revalidatePath('/', 'layout')
}
