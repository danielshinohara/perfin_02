import { describe, expect, it } from 'vitest'
import { ehRotaPublica } from './rotas'

describe('rotas públicas', () => {
  it('login, recuperação, acesso negado e offline são públicas', () => {
    for (const rota of ['/login', '/login/recuperar', '/acesso-negado', '/offline']) {
      expect(ehRotaPublica(rota)).toBe(true)
    }
  })

  it('links de e-mail e rotas de auth são públicos', () => {
    expect(ehRotaPublica('/auth/confirmar')).toBe(true)
    expect(ehRotaPublica('/auth/callback')).toBe(true)
    expect(ehRotaPublica('/api/publico/termometro')).toBe(true)
  })

  it('telas que exigem sessão não são públicas', () => {
    for (const rota of ['/', '/aguardando-aprovacao', '/conta/nova-senha', '/admin/usuarios', '/inflacao']) {
      expect(ehRotaPublica(rota)).toBe(false)
    }
  })

  it('não confunde prefixos parecidos nem variações de caixa', () => {
    for (const rota of ['/auth', '/authx/confirmar', '/login/outra', '/loginx', '/api/publicox', '/LOGIN', '']) {
      expect(ehRotaPublica(rota)).toBe(false)
    }
  })
})
