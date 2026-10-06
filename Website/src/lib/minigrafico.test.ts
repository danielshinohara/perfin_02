import { describe, expect, it } from 'vitest'
import { geometriaLinha } from './minigrafico'

describe('mini gráfico', () => {
  it('gera o caminho ignorando meses sem dado', () => {
    const g = geometriaLinha(
      [
        { mes: '01/2026', valor: 1 },
        { mes: '02/2026', valor: null },
        { mes: '03/2026', valor: 3 },
      ],
      100,
      50,
      0,
    )!
    expect(g.caminho).toBe('M0.0,50.0 L100.0,0.0')
    expect(g).toMatchObject({ minimo: 1, maximo: 3, ultimo: { x: 100, y: 0 } })
  })

  it('retorna null com menos de dois pontos e trata série constante', () => {
    expect(geometriaLinha([{ mes: 'a', valor: 1 }], 100, 50)).toBeNull()
    const constante = geometriaLinha([{ mes: 'a', valor: 2 }, { mes: 'b', valor: 2 }], 100, 50, 0)!
    expect(constante.caminho).toBe('M0.0,50.0 L100.0,50.0')
  })
})
