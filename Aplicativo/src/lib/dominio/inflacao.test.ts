import { describe, expect, it } from 'vitest'
import {
  acumulado12m,
  acumuladoNoAno,
  faixaDaMeta,
  mediaAnualizada3m,
  mesesSeguidosForaDaBanda,
  situacaoNaMeta,
  spread12m,
  ultimoMesDisponivel,
} from './inflacao'
import { Dec } from './numeros'
import { IPCA_2024, serieMensal } from '@/testes/fixtures'

const ipca = serieMensal(2024, IPCA_2024)
const metas = [{ ano: 2024, centro: '3.00', tolerancia: '1.50' }, { ano: 2025, centro: '3.00', tolerancia: '1.50' }]

describe('inflação', () => {
  it('acumulado em 12 meses e no ano de dezembro/2024 = 4,83%', () => {
    expect(acumulado12m(ipca, '2024-12')?.toDecimalPlaces(2).toString()).toBe('4.83')
    expect(acumuladoNoAno(ipca, '2024-12')?.toDecimalPlaces(2).toString()).toBe('4.83')
  })

  it('acumulado retorna null quando falta algum mês', () => {
    expect(acumulado12m(ipca, '2025-01')).toBeNull()
    const comBuraco = ipca.filter((p) => p.data !== '2024-06-01')
    expect(acumuladoNoAno(comBuraco, '2024-12')).toBeNull()
  })

  it('média de 3 meses anualizada', () => {
    const valor = mediaAnualizada3m(ipca, '2024-12')
    // (1,0056 × 1,0039 × 1,0052)^4 − 1
    expect(valor?.toDecimalPlaces(2).toString()).toBe('6.04')
  })

  it('situação na meta nos limites exatos da banda', () => {
    const faixa = faixaDaMeta(metas, 2024)!
    expect(situacaoNaMeta(new Dec('4.50'), faixa)).toBe('dentro')
    expect(situacaoNaMeta(new Dec('4.51'), faixa)).toBe('acima')
    expect(situacaoNaMeta(new Dec('1.50'), faixa)).toBe('dentro')
    expect(situacaoNaMeta(new Dec('1.49'), faixa)).toBe('abaixo')
  })

  it('conta meses seguidos fora da banda', () => {
    const longa = serieMensal(2024, [...IPCA_2024, '0.16', '1.31', '0.56'])
    // 12m: dez/24 4,83 | jan/25 4,56 | fev/25 5,06 | mar/25 5,48 → 4 meses acima do teto (4,50%)
    expect(mesesSeguidosForaDaBanda(longa, metas, '2025-03')).toBe(4)
  })

  it('zero meses quando dentro da banda', () => {
    const dentro = serieMensal(2024, Array(12).fill('0.25'))
    expect(mesesSeguidosForaDaBanda(dentro, metas, '2024-12')).toBe(0)
  })

  it('spread IGP-M − IPCA', () => {
    const igpm = serieMensal(2024, Array(12).fill('0.6'))
    expect(spread12m(igpm, ipca, '2024-12')?.toDecimalPlaces(2).toString()).toBe('2.61')
  })

  it('último mês disponível', () => {
    expect(ultimoMesDisponivel(ipca, '2026-10')).toBe('2024-12')
    expect(ultimoMesDisponivel(ipca, '2023-12')).toBeNull()
  })
})
