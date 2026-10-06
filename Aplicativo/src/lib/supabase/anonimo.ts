import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { envServidor } from '@/lib/env'

/** Cliente sem sessão (papel `anon`): só enxerga o que o RLS libera publicamente. */
export function criarClienteAnonimo() {
  const env = envServidor()
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
