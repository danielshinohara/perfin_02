import { describe, expect, it } from 'vitest'
import { estatisticasPeriodo, ultimoMesComVariacaoMaior, variacao12m, variacaoNoMes, volatilidade } from './cambio'
import { cdiAcumulado, decisoesCopom, valorVigente } from './juros'
import { serieDiaria } from '@/testes/fixtures'

describe('juros', () => {
  it('CDI acumulado compõe as taxas diárias do intervalo (inclusive)', () => {
    const cdi = serieDiaria('2026-01-01', ['0.05', '0.05', '0.05'])
    expect(cdiAcumulado(cdi, '2026-01-01', '2026-01-02')?.toString()).toBe('0.100025')
    expect(cdiAcumulado(cdi, '2027-01-01', '2027-01-02')).toBeNull()
  })

  it('CDI acumulado é null quando a série não cobre o fim ou o início do período', () => {
    const cdi = serieDiaria('2026-01-01', Array(10).fill('0.05'))
    expect(cdiAcumulado(cdi, '2026-01-01', '2026-01-31')).toBeNull() // dados só até 10/01
    expect(cdiAcumulado(cdi, '2025-12-01', '2026-01-10')).toBeNull() // dados só a partir de 01/01
    expect(cdiAcumulado(cdi, '2026-01-01', '2026-01-14')).not.toBeNull() // dentro da tolerância
  })

  it('valor vigente e decisões do Copom', () => {
    const selic = serieDiaria('2026-01-01', ['15', '15', '14.5', '14.5', '14'])
    expect(valorVigente(selic, '2026-01-03')?.toString()).toBe('14.5')
    const decisoes = decisoesCopom(selic)
    expect(decisoes.map((d) => [d.data, d.variacaoPp.toString()])).toEqual([
      ['2026-01-03', '-0.5'],
      ['2026-01-05', '-0.5'],
    ])
  })
})

describe('câmbio', () => {
  const usd = [
    { data: '2026-01-30', valor: '5.00' },
    { data: '2026-02-02', valor: '5.10' },
    { data: '2026-02-27', valor: '5.50' },
    { data: '2026-03-31', valor: '5.39' },
  ]

  it('variação no mês usa o fechamento do mês anterior como base', () => {
    expect(variacaoNoMes(usd, '2026-02')?.toString()).toBe('10')
    expect(variacaoNoMes(usd, '2026-03')?.toString()).toBe('-2')
    expect(variacaoNoMes(usd, '2026-01')).toBeNull()
  })

  it('variação em 12 meses exige cotação de um ano antes', () => {
    expect(variacao12m(usd, '2026-03-31')).toBeNull()
    const longa = [{ data: '2025-03-31', valor: '5.00' }, ...usd]
    expect(variacao12m(longa, '2026-03-31')?.toString()).toBe('7.8')
  })

  it('estatísticas do período', () => {
    const e = estatisticasPeriodo(usd, '2026-02-01', '2026-02-28')!
    expect(e.media.toString()).toBe('5.3')
    expect(e.maxima.data).toBe('2026-02-27')
    expect(e.minima.data).toBe('2026-02-02')
  })

  it('volatilidade é zero para preço constante e null sem dados suficientes', () => {
    const constante = serieDiaria('2026-01-01', Array(22).fill('5'))
    expect(volatilidade(constante, '2026-01-22')?.isZero()).toBe(true)
    expect(volatilidade(constante, '2026-01-10')).toBeNull()
  })

  it('volatilidade anualizada de retornos alternados', () => {
    const precos = Array.from({ length: 22 }, (_, i) => (i % 2 === 0 ? '5' : '5.05'))
    const vol = volatilidade(serieDiaria('2026-01-01', precos), '2026-01-22')!
    // |ln(1,01)| ≈ 0,00995 alternando sinal → desvio ≈ 0,0102 × √252 ≈ 16,2% a.a.
    expect(vol.toDecimalPlaces(1).toString()).toBe('16.2')
  })

  it('encontra o último mês com variação maior', () => {
    const serie = [
      { data: '2025-12-31', valor: '5.00' },
      { data: '2026-01-30', valor: '5.60' },
      { data: '2026-02-27', valor: '5.70' },
      { data: '2026-03-31', valor: '6.00' },
    ]
    expect(ultimoMesComVariacaoMaior(serie, '2026-03', '2015-01')).toBe('2026-01')
    expect(ultimoMesComVariacaoMaior(serie, '2026-01', '2015-01')).toBeNull()
  })
})
