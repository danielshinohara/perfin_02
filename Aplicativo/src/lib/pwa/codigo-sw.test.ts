import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { codigoServiceWorker } from './codigo-sw'

type Estrategia = (url: URL, metodo: string, navegacao: boolean) => string

function carregarServiceWorker(): Estrategia {
  const contexto: Record<string, unknown> = {
    URL,
    self: { location: { origin: 'https://portal.exemplo.com' }, addEventListener: () => undefined },
  }
  runInNewContext(codigoServiceWorker('teste'), contexto)
  return contexto.estrategiaPara as Estrategia
}

const estrategia = carregarServiceWorker()
const url = (caminho: string) => new URL(caminho, 'https://portal.exemplo.com')

describe('service worker', () => {
  it('estáticos usam cache primeiro', () => {
    expect(estrategia(url('/_next/static/chunks/a.js'), 'GET', false)).toBe('cache-primeiro')
    expect(estrategia(url('/icones/192'), 'GET', false)).toBe('cache-primeiro')
  })

  it('páginas de dados usam rede primeiro (cache só offline)', () => {
    expect(estrategia(url('/'), 'GET', true)).toBe('rede-primeiro')
    expect(estrategia(url('/inflacao?inicio=2025-01'), 'GET', true)).toBe('rede-primeiro')
  })

  it('a calculadora não vai para o cache', () => {
    expect(estrategia(url('/calculadora'), 'GET', true)).toBe('rede-com-pagina-offline')
  })

  it('dados sensíveis nunca vão para o cache', () => {
    for (const caminho of ['/agenda', '/assistente', '/relatorios', '/admin/usuarios', '/login', '/auth/callback']) {
      expect(estrategia(url(caminho), 'GET', true)).toBe('rede-com-pagina-offline')
    }
    for (const caminho of ['/api/assistente', '/api/relatorios/1/xlsx', '/auth/callback?code=x']) {
      expect(estrategia(url(caminho), 'GET', false)).toBe('rede')
    }
    expect(estrategia(url('/api/relatorios'), 'POST', false)).toBe('rede')
  })

  it('outras origens e requisições RSC passam direto', () => {
    expect(estrategia(new URL('https://www.googleapis.com/x'), 'GET', false)).toBe('rede')
    expect(estrategia(url('/inflacao?_rsc=abc'), 'GET', false)).toBe('rede')
  })

  it('a versão é sanitizada', () => {
    expect(codigoServiceWorker("a'b;c")).toContain("const VERSAO = 'abc';")
  })
})
