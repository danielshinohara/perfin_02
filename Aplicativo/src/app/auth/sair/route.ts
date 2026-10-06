import { NextResponse } from 'next/server'
import { urlDoSite } from '@/lib/env'
import { criarClienteServidor } from '@/lib/supabase/servidor'

export async function POST() {
  const supabase = await criarClienteServidor()
  await supabase.auth.signOut()
  const resposta = NextResponse.redirect(urlDoSite('/login'), 303)
  // Apaga páginas em cache do PWA neste aparelho (podem conter dados do usuário que saiu).
  resposta.headers.set('Clear-Site-Data', '"cache"')
  return resposta
}
