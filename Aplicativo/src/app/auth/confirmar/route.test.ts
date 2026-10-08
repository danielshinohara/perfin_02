import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase/servidor', () => ({
  criarClienteServidor: async () => ({
    auth: { verifyOtp: mocks.verifyOtp, exchangeCodeForSession: mocks.exchangeCodeForSession },
    rpc: mocks.rpc,
  }),
}))

vi.mock('@/lib/env', () => ({
  urlDoSite: (caminho = '') => `https://app.exemplo${caminho}`,
}))

import { GET, POST } from './route'

const ORIGEM = 'https://app.exemplo'

async function abrir(consulta: string) {
  const resposta = await GET(new NextRequest(`${ORIGEM}/auth/confirmar${consulta}`))
  return { status: resposta.status, destino: resposta.headers.get('location') }
}

async function enviar(campos: Record<string, string>, origem: string | null = ORIGEM) {
  const corpo = new URLSearchParams(campos)
  const cabecalhos: Record<string, string> = { 'content-type': 'application/x-www-form-urlencoded' }
  if (origem) cabecalhos.origin = origem
  const resposta = await POST(new NextRequest(`${ORIGEM}/auth/confirmar`, { method: 'POST', body: corpo, headers: cabecalhos }))
  return { status: resposta.status, destino: resposta.headers.get('location') }
}

beforeEach(() => {
  mocks.verifyOtp.mockReset().mockResolvedValue({ error: null })
  mocks.exchangeCodeForSession.mockReset().mockResolvedValue({ error: null })
  mocks.rpc.mockReset().mockResolvedValue({ error: null })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /auth/confirmar', () => {
  it('token_hash + type não consome o token: leva à página com o botão de confirmar', async () => {
    const r = await abrir('?token_hash=abc123&type=email')
    expect(mocks.verifyOtp).not.toHaveBeenCalled()
    expect(r.destino).toBe(`${ORIGEM}/conta/confirmar?token_hash=abc123&type=email`)
  })

  it('parâmetros externos não controlam o destino (sem open redirect)', async () => {
    const r = await abrir('?token_hash=abc&type=signup&next=https://malicioso.exemplo&redirect_to=//malicioso')
    expect(r.destino).toBe(`${ORIGEM}/conta/confirmar?token_hash=abc&type=signup`)
  })

  it('type inválido ou ausente, sem code: link inválido', async () => {
    expect((await abrir('?token_hash=abc123&type=magiclink')).destino).toBe(`${ORIGEM}/login?erro=link`)
    expect((await abrir('?token_hash=abc123')).destino).toBe(`${ORIGEM}/login?erro=link`)
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it('code (PKCE): troca pela sessão, registra acesso e vai para /', async () => {
    const r = await abrir('?code=codigo-pkce')
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith('codigo-pkce')
    expect(mocks.rpc).toHaveBeenCalledWith('registrar_acesso')
    expect(r.destino).toBe(`${ORIGEM}/`)
  })

  it('code + type=recovery (link padrão de nova senha) vai para a tela de nova senha', async () => {
    const r = await abrir('?code=codigo-pkce&type=recovery')
    expect(r.destino).toBe(`${ORIGEM}/conta/nova-senha`)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('code inválido (outro navegador): mensagem própria', async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: { code: 'bad_code_verifier' } })
    expect((await abrir('?code=ruim')).destino).toBe(`${ORIGEM}/login?erro=link-outro-navegador`)
  })

  it('sem parâmetros: link inválido, sem chamar o Supabase', async () => {
    expect((await abrir('')).destino).toBe(`${ORIGEM}/login?erro=link`)
    expect((await abrir('?token_hash=&code=')).destino).toBe(`${ORIGEM}/login?erro=link`)
    expect(mocks.verifyOtp).not.toHaveBeenCalled()
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled()
  })
})

describe('POST /auth/confirmar', () => {
  it('cadastro: verifica o token, registra acesso e vai para / (303)', async () => {
    const r = await enviar({ token_hash: 'abc123', type: 'email' })
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: 'abc123', type: 'email' })
    expect(mocks.rpc).toHaveBeenCalledWith('registrar_acesso')
    expect(r).toEqual({ status: 303, destino: `${ORIGEM}/` })
  })

  it('recuperação: vai para a tela de nova senha sem registrar acesso', async () => {
    const r = await enviar({ token_hash: 'abc123', type: 'recovery' })
    expect(r.destino).toBe(`${ORIGEM}/conta/nova-senha`)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('recusa formulário enviado de outro site ou sem Origin', async () => {
    expect((await enviar({ token_hash: 'abc', type: 'email' }, 'https://malicioso.exemplo')).destino).toBe(`${ORIGEM}/login?erro=link`)
    expect((await enviar({ token_hash: 'abc', type: 'email' }, null)).destino).toBe(`${ORIGEM}/login?erro=link`)
    expect(mocks.verifyOtp).not.toHaveBeenCalled()
  })

  it('campos ausentes ou type inválido: link inválido', async () => {
    expect((await enviar({ type: 'email' })).destino).toBe(`${ORIGEM}/login?erro=link`)
    expect((await enviar({ token_hash: 'abc', type: 'magiclink' })).destino).toBe(`${ORIGEM}/login?erro=link`)
    expect(mocks.verifyOtp).not.toHaveBeenCalled()
  })

  it('token expirado: link inválido', async () => {
    mocks.verifyOtp.mockResolvedValue({ error: { code: 'otp_expired' } })
    expect((await enviar({ token_hash: 'velho', type: 'recovery' })).destino).toBe(`${ORIGEM}/login?erro=link`)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })

  it('falha ao registrar acesso não impede o redirecionamento', async () => {
    mocks.rpc.mockResolvedValue({ error: { code: 'XX000' } })
    expect((await enviar({ token_hash: 'abc', type: 'email' })).destino).toBe(`${ORIGEM}/`)
  })
})
