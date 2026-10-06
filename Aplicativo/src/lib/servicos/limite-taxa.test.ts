import { describe, expect, it } from 'vitest'
import { criarLimitador } from './limite-taxa'

describe('limitador', () => {
  it('bloqueia acima do máximo dentro da janela e libera depois', () => {
    const permitir = criarLimitador(2, 1000)
    expect(permitir('u1', 0)).toBe(true)
    expect(permitir('u1', 10)).toBe(true)
    expect(permitir('u1', 20)).toBe(false)
    expect(permitir('u2', 20)).toBe(true)
    expect(permitir('u1', 1001)).toBe(true)
  })
})
