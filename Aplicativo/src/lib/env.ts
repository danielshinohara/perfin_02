import 'server-only'
import { z } from 'zod'

const esquemaServidor = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  GOOGLE_CLIENT_ID: z.string().min(10),
  GOOGLE_CLIENT_SECRET: z.string().min(10),
  ADMIN_USUARIO: z.email(),
  GEMINI_API_KEY: z.string().min(10),
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, 'base64').length === 32, 'deve ter 32 bytes em base64'),
})

export type EnvServidor = z.infer<typeof esquemaServidor>

let cache: EnvServidor | null = null

/** Variáveis do servidor validadas na primeira leitura. Falha cedo, sem exibir valores. */
export function envServidor(): EnvServidor {
  if (cache) return cache
  const resultado = esquemaServidor.safeParse(process.env)
  if (!resultado.success) {
    const nomes = resultado.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Variáveis de ambiente ausentes ou inválidas: ${nomes}`)
  }
  cache = resultado.data
  return cache
}

/** URL pública do portal (sem barra final), vinda de NEXT_PUBLIC_SITE_URL. */
export function urlDoSite(caminho = ''): string {
  return `${envServidor().NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}${caminho}`
}
