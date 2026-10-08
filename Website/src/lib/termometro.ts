import 'server-only'
import { z } from 'zod'
import { urlDoPortal } from './portal'

const esquema = z.object({
  atualizadoEm: z.string(),
  indicadores: z.array(
    z.object({
      id: z.string(),
      titulo: z.string(),
      valor: z.number().nullable(),
      valorFormatado: z.string(),
      referencia: z.string().nullable(),
      complemento: z.string().nullable(),
    }),
  ),
  graficos: z.array(
    z.object({
      id: z.string(),
      titulo: z.string(),
      unidade: z.enum(['percentual', 'moeda']),
      pontos: z.array(z.object({ mes: z.string(), valor: z.number().nullable() })),
    }),
  ),
  // Mostra no máximo 3 insights, mesmo que a API passe a mandar mais.
  insights: z.array(z.object({ titulo: z.string(), texto: z.string() })).transform((lista) => lista.slice(0, 3)),
  fonte: z.string(),
})

export type Termometro = z.infer<typeof esquema>

const UMA_HORA = 3600

/** Busca o termômetro na API pública do Portal, com cache de 1 hora. Retorna null se indisponível. */
export async function buscarTermometro(): Promise<Termometro | null> {
  try {
    const resposta = await fetch(urlDoPortal('/api/publico/termometro'), { next: { revalidate: UMA_HORA } })
    if (!resposta.ok) return null
    const dados = esquema.safeParse(await resposta.json())
    return dados.success ? dados.data : null
  } catch (erro) {
    console.error('[termometro]', erro instanceof Error ? erro.message : 'erro desconhecido')
    return null
  }
}
