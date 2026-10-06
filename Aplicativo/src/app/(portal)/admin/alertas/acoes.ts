'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { exigirAdmin } from '@/lib/auth/sessao'
import { LIMITE_MAXIMO_ABSOLUTO, REGRAS_COM_LIMITE_INFERIOR, usaLimite } from '@/lib/dominio/insights/configuracao'
import { CODIGOS_REGRAS } from '@/lib/dominio/tipos'
import { atualizarRegra } from '@/lib/servicos/admin'
import { criarClienteServidor } from '@/lib/supabase/servidor'

export interface EstadoRegra {
  mensagem: string | null
  erro: boolean
}

// Aceita "6", "6,5" ou "6.5"; vazio = sem limite.
const numeroOpcional = z
  .string()
  .trim()
  .max(12)
  .transform((v) => v.replace(',', '.'))
  .refine((v) => v === '' || (/^-?\d+(\.\d{1,4})?$/.test(v) && Math.abs(Number(v)) < LIMITE_MAXIMO_ABSOLUTO), 'Número inválido')
  .transform((v) => (v === '' ? null : v))

const esquema = z.object({
  codigo: z.enum(CODIGOS_REGRAS),
  limite: numeroOpcional,
  limiteSecundario: numeroOpcional,
  severidade: z.enum(['informativo', 'atencao', 'alerta']),
  ativa: z.boolean(),
})

export async function salvarRegra(_estado: EstadoRegra, formulario: FormData): Promise<EstadoRegra> {
  await exigirAdmin()
  const dados = esquema.safeParse({
    codigo: formulario.get('codigo'),
    limite: formulario.get('limite') ?? '',
    limiteSecundario: formulario.get('limiteSecundario') ?? '',
    severidade: formulario.get('severidade'),
    ativa: formulario.get('ativa') === 'on',
  })
  if (!dados.success) return { mensagem: 'Verifique os valores: use números como 6 ou 6,5.', erro: true }
  const { codigo, limite, limiteSecundario } = dados.data
  if (usaLimite(codigo) && limite === null) return { mensagem: 'Esta regra precisa de um limite.', erro: true }
  if (REGRAS_COM_LIMITE_INFERIOR.includes(codigo) && limiteSecundario === null) {
    return { mensagem: 'Informe também o limite inferior.', erro: true }
  }
  try {
    await atualizarRegra(await criarClienteServidor(), dados.data)
  } catch {
    return { mensagem: 'Não foi possível salvar. Confirme que você entrou como administrador (e-mail e senha).', erro: true }
  }
  revalidatePath('/admin/alertas')
  return { mensagem: 'Regra salva.', erro: false }
}
