import 'server-only'
import { cifrar, decifrar, TokenInvalidoError } from '@/lib/cripto/tokens'
import { envServidor } from '@/lib/env'
import { ESCOPOS_GOOGLE } from '@/lib/google/escopos'
import { GoogleReconectarError } from '@/lib/google/http'
import type { ClienteSupabase } from '@/lib/supabase/servidor'

export async function salvarRefreshToken(supabase: ClienteSupabase, userId: string, refreshToken: string): Promise<void> {
  const { error } = await supabase.from('google_tokens').upsert({
    user_id: userId,
    refresh_token_cifrado: cifrar(refreshToken, envServidor().TOKEN_ENCRYPTION_KEY),
    escopos: ESCOPOS_GOOGLE.join(' '),
    atualizado_em: new Date().toISOString(),
  })
  if (error) throw new Error('Não foi possível salvar a conexão com o Google')
}

async function apagarRefreshToken(supabase: ClienteSupabase, userId: string): Promise<void> {
  await supabase.from('google_tokens').delete().eq('user_id', userId)
}

async function lerRefreshToken(supabase: ClienteSupabase, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('google_tokens')
    .select('refresh_token_cifrado')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error('Não foi possível ler a conexão com o Google')
  if (!data) throw new GoogleReconectarError()
  try {
    return decifrar(data.refresh_token_cifrado, envServidor().TOKEN_ENCRYPTION_KEY)
  } catch (erro) {
    if (!(erro instanceof TokenInvalidoError)) throw erro
    await apagarRefreshToken(supabase, userId)
    throw new GoogleReconectarError()
  }
}

/** Gera um access token novo a partir do refresh token guardado (criptografado) do usuário. */
export async function obterAccessToken(supabase: ClienteSupabase, userId: string): Promise<string> {
  const refreshToken = await lerRefreshToken(supabase, userId)
  const env = envServidor()
  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  })
  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as { error?: string } | null
    // Só invalid_grant significa token revogado/expirado. Outros erros (ex.: invalid_client por
    // client secret trocado) são de configuração e não podem apagar a conexão dos usuários.
    if (corpo?.error === 'invalid_grant') {
      await apagarRefreshToken(supabase, userId)
      throw new GoogleReconectarError()
    }
    throw new Error(`O Google recusou a renovação do acesso (${corpo?.error ?? resposta.status})`)
  }
  const corpo = (await resposta.json()) as { access_token: string }
  return corpo.access_token
}
