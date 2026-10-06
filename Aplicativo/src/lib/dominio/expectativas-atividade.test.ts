import { describe, expect, it } from 'vitest'
import { crescimento12m, variacaoInteranual } from './atividade'
import { inflacaoDoAno, inflacaoImplicitaRestante, revisoesSeguidas, serieSemanal, ultimaExpectativa } from './expectativas'
import { Dec } from './numeros'
import type { Expectativa } from './tipos'
import { serieMensal } from '@/testes/fixtures'

const focus: Expectativa[] = [
  { indicador: 'IPCA', referencia: '2026', dataColeta: '2026-09-07', mediana: '4.50' },
  { indicador: 'IPCA', referencia: '2026', dataColeta: '2026-09-11', mediana: '4.60' },
  { indicador: 'IPCA', referencia: '2026', dataColeta: '2026-09-18', mediana: '4.70' },
  { indicador: 'IPCA', referencia: '2026', dataColeta: '2026-09-25', mediana: '4.80' },
  { indicador: 'IPCA', referencia: '2027', dataColeta: '2026-09-25', mediana: '4.00' },
]

describe('expectativas (Focus)', () => {
  it('agrupa por semana mantendo a coleta mais recente', () => {
    expect(serieSemanal(focus, 'IPCA', '2026')).toEqual([
      { data: '2026-09-07', valor: '4.60' },
      { data: '2026-09-14', valor: '4.70' },
      { data: '2026-09-21', valor: '4.80' },
    ])
  })

  it('conta revisões seguidas na mesma direção', () => {
    expect(revisoesSeguidas(serieSemanal(focus, 'IPCA', '2026'))).toEqual({ direcao: 'alta', semanas: 2 })
    const misto = [{ data: 'a', valor: '5' }, { data: 'b', valor: '4' }, { data: 'c', valor: '4.1' }]
    expect(revisoesSeguidas(misto)).toEqual({ direcao: 'alta', semanas: 1 })
    expect(revisoesSeguidas([{ data: 'a', valor: '4' }, { data: 'b', valor: '4' }])).toEqual({ direcao: 'estavel', semanas: 0 })
  })

  it('última expectativa até a data', () => {
    expect(ultimaExpectativa(focus, 'IPCA', '2026', '2026-09-20')?.mediana).toBe('4.70')
    expect(ultimaExpectativa(focus, 'SELIC', '2026', '2026-09-20')).toBeNull()
  })

  it('inflação implícita no restante do ano', () => {
    expect(inflacaoImplicitaRestante(new Dec('4.8'), new Dec('3.5')).toDecimalPlaces(4).toString()).toBe('1.256')
  })

  it('IPCA do ano: esperado, acumulado e restante', () => {
    const ipca = serieMensal(2026, ['1', '1'])
    const r = inflacaoDoAno(focus, ipca, '2026-09-30')!
    expect(r).toMatchObject({ ano: 2026, mesAcumulado: '2026-02' })
    expect(r.esperado.toString()).toBe('4.8')
    expect(r.acumulado.toString()).toBe('2.01')
    expect(inflacaoDoAno(focus, serieMensal(2025, ['1']), '2026-09-30')).toBeNull() // sem IPCA do ano
  })
})

describe('atividade', () => {
  it('crescimento em 12 meses compara médias de 12 meses', () => {
    const ibc = serieMensal(2024, [...Array(12).fill('100'), ...Array(12).fill('103')])
    expect(crescimento12m(ibc, '2025-12')?.toString()).toBe('3')
    expect(crescimento12m(ibc, '2025-11')).toBeNull() // faltaria dez/2023
    expect(crescimento12m(ibc, '2024-12')).toBeNull()
  })

  it('variação interanual', () => {
    const fbcf = [
      { data: '2025-01-01', valor: '100' },
      { data: '2025-10-01', valor: '110' },
      { data: '2026-01-01', valor: '121' },
    ]
    expect(variacaoInteranual(fbcf, '2026-01-01')?.toString()).toBe('21')
    expect(variacaoInteranual(fbcf, '2025-10-01')).toBeNull()
  })
})
