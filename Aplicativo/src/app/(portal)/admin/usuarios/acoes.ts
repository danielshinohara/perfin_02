'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirAdmin } from '@/lib/auth/sessao'
import { alterarBloqueio } from '@/lib/servicos/admin'
import { criarClienteServidor } from '@/lib/supabase/servidor'

const esquema = z.object({ userId: z.uuid(), bloquear: z.enum(['sim', 'nao']) })

export async function alternarBloqueio(formulario: FormData): Promise<void> {
  const sessao = await exigirAdmin()
  const dados = esquema.safeParse({ userId: formulario.get('userId'), bloquear: formulario.get('bloquear') })
  if (!dados.success) throw new Error('Dados inválidos')
  if (dados.data.userId === sessao.userId) throw new Error('Você não pode bloquear a si mesmo')
  await alterarBloqueio(await criarClienteServidor(), dados.data.userId, dados.data.bloquear === 'sim')
  revalidatePath('/admin/usuarios')
}
