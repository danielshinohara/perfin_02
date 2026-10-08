import { afterEach, describe, expect, it, vi } from 'vitest'
import { linksDeAcesso, urlDoPortal } from './portal'

describe('links do portal', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('monta Entrar e Criar conta a partir de PORTAL_URL, sem barra dupla', () => {
    vi.stubEnv('PORTAL_URL', 'https://portal.exemplo/')
    expect(linksDeAcesso()).toEqual({
      entrar: 'https://portal.exemplo/login',
      criarConta: 'https://portal.exemplo/login?modo=cadastro',
    })
  })

  it('falha com mensagem clara quando PORTAL_URL não está configurada', () => {
    vi.stubEnv('PORTAL_URL', '')
    expect(() => urlDoPortal('/login')).toThrow('PORTAL_URL')
  })
})
