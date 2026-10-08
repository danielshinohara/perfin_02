import { describe, expect, it } from 'vitest'
import { ehSessaoDeRecuperacao, metodoDeLogin, papelDaSessao } from './papel'

const ADMIN = 'admin@exemplo.com'

describe('papel da sessão', () => {
  it('admin só com e-mail do admin e login por senha', () => {
    expect(papelDaSessao(ADMIN, [{ method: 'password', timestamp: 1 }], ADMIN)).toBe('admin')
    expect(papelDaSessao(' Admin@Exemplo.com ', ['password'], ADMIN)).toBe('admin')
  })

  it('mesmo e-mail pelo Google é usuário', () => {
    expect(papelDaSessao(ADMIN, [{ method: 'oauth', timestamp: 1 }], ADMIN)).toBe('usuario')
  })

  it('outro e-mail com senha é usuário', () => {
    expect(papelDaSessao('outro@exemplo.com', ['password'], ADMIN)).toBe('usuario')
  })

  it('e-mail vazio nunca é admin, mesmo com admin mal configurado', () => {
    expect(papelDaSessao('', ['password'], '')).toBe('usuario')
    expect(papelDaSessao(undefined, ['password'], ADMIN)).toBe('usuario')
  })

  it('método de login com amr ausente ou desconhecido', () => {
    expect(metodoDeLogin(undefined)).toBe('outro')
    expect(metodoDeLogin([{ method: 'totp' }])).toBe('outro')
    expect(metodoDeLogin([{ method: 'password' }, { method: 'totp' }])).toBe('senha')
  })
})

describe('sessão de recuperação de senha', () => {
  const AGORA = 1_800_000_000

  it('aceita link de recuperação ou OTP aberto há até 15 minutos', () => {
    expect(ehSessaoDeRecuperacao([{ method: 'recovery', timestamp: AGORA - 60 }], AGORA)).toBe(true)
    expect(ehSessaoDeRecuperacao([{ method: 'otp', timestamp: AGORA - 15 * 60 }], AGORA)).toBe(true)
  })

  it('recusa link antigo', () => {
    expect(ehSessaoDeRecuperacao([{ method: 'recovery', timestamp: AGORA - 15 * 60 - 1 }], AGORA)).toBe(false)
  })

  it('sessão do Google ou de senha não pode definir senha sem o link', () => {
    expect(ehSessaoDeRecuperacao([{ method: 'oauth', timestamp: AGORA }], AGORA)).toBe(false)
    expect(ehSessaoDeRecuperacao([{ method: 'password', timestamp: AGORA }], AGORA)).toBe(false)
  })

  it('formatos inesperados são recusados', () => {
    expect(ehSessaoDeRecuperacao(['recovery'], AGORA)).toBe(false)
    expect(ehSessaoDeRecuperacao([{ method: 'recovery' }], AGORA)).toBe(false)
    expect(ehSessaoDeRecuperacao([null, 1, 'x'], AGORA)).toBe(false)
    expect(ehSessaoDeRecuperacao(undefined, AGORA)).toBe(false)
  })

  it('usuário comum que entra com senha não é admin', () => {
    expect(papelDaSessao('cliente@exemplo.com', [{ method: 'password', timestamp: AGORA }], ADMIN)).toBe('usuario')
  })
})
