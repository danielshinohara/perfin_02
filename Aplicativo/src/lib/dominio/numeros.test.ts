import { describe, expect, it } from 'vitest'
import { comporPercentuais, Dec, desvioPadrao, taxaReal, variacaoPercentual } from './numeros'
import { IPCA_2024 } from '@/testes/fixtures'

describe('numeros', () => {
  it('compõe as variações mensais do IPCA 2024 em 4,83%', () => {
    const acumulado = comporPercentuais(IPCA_2024.map((v) => new Dec(v)))
    expect(acumulado.toDecimalPlaces(2).toString()).toBe('4.83')
  })

  it('compor lista vazia resulta em zero', () => {
    expect(comporPercentuais([]).isZero()).toBe(true)
  })

  it('calcula a taxa real sem erro de ponto flutuante', () => {
    expect(taxaReal(new Dec('10.5'), new Dec('5')).toDecimalPlaces(6).toString()).toBe('5.238095')
  })

  it('taxa real é negativa quando a inflação supera o nominal', () => {
    expect(taxaReal(new Dec('3'), new Dec('5')).isNegative()).toBe(true)
  })

  it('variação percentual', () => {
    expect(variacaoPercentual(new Dec('5'), new Dec('5.5')).toString()).toBe('10')
  })

  it('desvio-padrão amostral', () => {
    const valores = ['2', '4', '4', '4', '5', '5', '7', '9'].map((v) => new Dec(v))
    expect(desvioPadrao(valores).toDecimalPlaces(4).toString()).toBe('2.1381')
  })
})
