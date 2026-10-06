import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { envServidor } from '@/lib/env'
import { ehRotaPublica } from './rotas'

/**
 * Renova a sessão do Supabase a cada requisição e faz a checagem otimista de login.
 * A autorização de verdade (bloqueio, papel) é feita no servidor de cada página/rota.
 */
export async function atualizarSessao(request: NextRequest): Promise<NextResponse> {
  const env = envServidor()
  let resposta = NextResponse.next({ request })
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value))
        resposta = NextResponse.next({ request })
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const caminho = request.nextUrl.pathname
  if (!data?.claims && !ehRotaPublica(caminho)) {
    if (caminho.startsWith('/api/')) {
      return NextResponse.json({ erro: 'Sessão expirada. Entre novamente.' }, { status: 401 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return resposta
}
