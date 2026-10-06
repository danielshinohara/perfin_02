import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { envServidor } from '@/lib/env'

/** Cliente Supabase com a sessão do usuário (cookies). Todas as consultas passam pelo RLS. */
export async function criarClienteServidor() {
  // cookies() primeiro: marca a rota como dinâmica (nunca pré-renderizada com dados de sessão).
  const armazenamento = await cookies()
  const env = envServidor()
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => armazenamento.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => armazenamento.set(name, value, options))
        } catch {
          // Em Server Components os cookies são somente leitura; o proxy renova a sessão.
        }
      },
    },
  })
}

export type ClienteSupabase = Awaited<ReturnType<typeof criarClienteServidor>>
