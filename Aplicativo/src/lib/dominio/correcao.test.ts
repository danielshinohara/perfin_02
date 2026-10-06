import { describe, expect, it } from 'vitest'
import { corrigirValor, DadosInsuficientesError, lerEntradaCorrecao, lerValorMonetario } from './correcao'
import { Dec } from './numeros'
import { IPCA_2024, serieDiaria, serieMensal } from '@/testes/fixtures'

describe('calculadora de correção', () => {
  const ipca = serieMensal(2024, IPCA_2024)

  it('corrige mil reais pelo IPCA de jan a dez/2024 (meses inclusivos)', () => {
    const r = corrigirValor(new Dec('1000'), 'IPCA', ipca, '2024-01-15', '2024-12-10')
    expect(r.valorCorrigido.toString()).toBe('1048.31')
    expect(r.variacaoPct.toDecimalPlaces(2).toString()).toBe('4.83')
    expect(r).toMatchObject({ aplicadoAte: '2024-12-01', parcial: false })
  })

  it('arredonda centavos meio para cima só no final', () => {
    const r = corrigirValor(new Dec('0.05'), 'IPCA', serieMensal(2024, ['10']), '2024-01-01', '2024-01-31')
    expect(r.valorCorrigido.toString()).toBe('0.06') // 0,055 -> 0,06
  })

  it('índice ainda não divulgado no fim: corrige até o último mês e marca como parcial', () => {
    const r = corrigirValor(new Dec('1000'), 'IPCA', ipca, '2024-06-01', '2025-02-10')
    expect(r).toMatchObject({ aplicadoAte: '2024-12-01', parcial: true })
  })

  it('falta de mês no meio do período é erro', () => {
    const comBuraco = ipca.filter((p) => p.data !== '2024-06-01')
    expect(() => corrigirValor(new Dec('1'), 'IPCA', comBuraco, '2024-01-01', '2024-12-01')).toThrow(DadosInsuficientesError)
    expect(() => corrigirValor(new Dec('1'), 'IPCA', ipca, '2025-03-01', '2025-05-01')).toThrow(DadosInsuficientesError)
  })

  it('CDI compõe da data inicial até a véspera da final', () => {
    const cdi = serieDiaria('2026-01-01', ['0.05', '0.05', '0.05'])
    const r = corrigirValor(new Dec('1000'), 'CDI', cdi, '2026-01-01', '2026-01-03')
    expect(r.fator.toString()).toBe('1.00100025')
    expect(r.valorCorrigido.toString()).toBe('1001')
    expect(r.parcial).toBe(false)
  })

  it('CDI tolera fim de semana entre o último dia útil e a data final', () => {
    // sexta 02/01/2026 é o último dado; data final segunda 05/01
    const cdi = [{ data: '2026-01-02', valor: '0.05' }]
    expect(corrigirValor(new Dec('1000'), 'CDI', cdi, '2026-01-02', '2026-01-05').parcial).toBe(false)
  })

  it('período invertido ou vazio é erro', () => {
    expect(() => corrigirValor(new Dec('1'), 'IPCA', ipca, '2024-06-01', '2024-01-01')).toThrow(RangeError)
    expect(() => corrigirValor(new Dec('1'), 'CDI', serieDiaria('2026-01-01', ['0.05']), '2026-01-01', '2026-01-01')).toThrow(RangeError)
  })
})

describe('leitura do valor em reais', () => {
  it.each([
    ['1.000', '1000'],
    ['1.000,00', '1000'],
    ['1.234.567,89', '1234567.89'],
    ['1234,5', '1234.5'],
    ['1234.56', '1234.56'],
    ['R$ 2.500', '2500'],
    ['10', '10'],
  ])('%s -> %s', (texto, esperado) => {
    expect(lerValorMonetario(texto)?.toString()).toBe(esperado)
  })

  it.each(['', '0', '-5', 'abc', '1,2,3', '1.00.0', '1.2345', '12.345,678'])('rejeita %s', (texto) => {
    expect(lerValorMonetario(texto)).toBeNull()
  })
})

describe('validação do formulário', () => {
  const campos = { valor: '1.000,00', indice: 'IPCA', inicio: '2024-01-01', fim: '2024-12-31' }

  it('aceita campos válidos', () => {
    expect(lerEntradaCorrecao(campos, '2026-10-06').entrada?.valor.toString()).toBe('1000')
  })

  it('rejeita índice, datas e período inválidos', () => {
    expect(lerEntradaCorrecao({ ...campos, indice: 'XPTO' }, '2026-10-06').erro).toMatch(/índice/)
    expect(lerEntradaCorrecao({ ...campos, fim: '2027-01-01' }, '2026-10-06').erro).toMatch(/hoje/)
    expect(lerEntradaCorrecao({ ...campos, fim: campos.inicio }, '2026-10-06').erro).toMatch(/posterior/)
  })
})
