import { NextResponse } from 'next/server'
import { urlDoSite } from '@/lib/env'
import { ESCOPOS_GOOGLE } from '@/lib/google/escopos'
import { criarClienteServidor } from '@/lib/supabase/servidor'

/** Inicia o login com Google (PKCE). O retorno vai para NEXT_PUBLIC_SITE_URL/auth/callback. */
export async function POST() {
  const supabase = await criarClienteServidor()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: urlDoSite('/auth/callback'),
      scopes: ESCOPOS_GOOGLE.join(' '),
      // offline + consent garantem o refresh token para usar Drive, Agenda e Gmail depois.
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })
  if (error || !data.url) return NextResponse.redirect(urlDoSite('/login?erro=google'), 303)
  return NextResponse.redirect(data.url, 303)
}
