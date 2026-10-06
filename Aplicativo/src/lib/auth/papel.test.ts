import { describe, expect, it } from 'vitest'
import { metodoDeLogin, papelDaSessao } from './papel'

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
