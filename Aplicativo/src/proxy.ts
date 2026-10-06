import type { NextRequest } from 'next/server'
import { atualizarSessao } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return atualizarSessao(request)
}

export const config = {
  // Ignora estáticos, service worker, manifesto, ícones e a API pública (que não pode receber Set-Cookie).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icones/|api/publico/).*)'],
}
