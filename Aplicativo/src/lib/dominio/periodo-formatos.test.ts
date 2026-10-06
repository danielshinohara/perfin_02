import { describe, expect, it } from 'vitest'
import {
  formatarData,
  formatarDataHora,
  formatarMesAno,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  formatarPontos,
} from './formatos'
import { dataDeReferencia, filtrosParaBusca, lerFiltros } from './periodo'
import { CODIGOS_INDICADORES } from './tipos'

const HOJE = '2026-10-06'

describe('filtros', () => {
  it('padrão: últimos 24 meses e todos os indicadores', () => {
    const { filtros, aviso } = lerFiltros({}, HOJE)
    expect(filtros).toEqual({ inicio: '2024-11', fim: '2026-10', indicadores: [...CODIGOS_INDICADORES] })
    expect(aviso).toBeNull()
  })

  it('aceita indicadores repetidos ou separados por vírgula', () => {
    expect(lerFiltros({ ind: ['IPCA', 'usd'] }, HOJE).filtros.indicadores).toEqual(['IPCA', 'USD'])
    expect(lerFiltros({ ind: 'IPCA,IPCA,CDI' }, HOJE).filtros.indicadores).toEqual(['IPCA', 'CDI'])
  })

  it('rejeita valores inválidos com aviso', () => {
    const r = lerFiltros({ inicio: '2024-13', ind: 'XPTO' }, HOJE)
    expect(r.filtros.inicio).toBe('2024-11')
    expect(r.filtros.indicadores).toHaveLength(CODIGOS_INDICADORES.length)
    expect(r.aviso).not.toBeNull()
  })

  it('limita ao intervalo disponível e trata início depois do fim', () => {
    expect(lerFiltros({ inicio: '2010-01', fim: '2030-01' }, HOJE).filtros).toMatchObject({
      inicio: '2015-01',
      fim: '2026-10',
    })
    const invertido = lerFiltros({ inicio: '2026-05', fim: '2026-01' }, HOJE)
    expect(invertido.filtros.inicio).toBe('2024-11')
    expect(invertido.aviso).toMatch(/posterior/)
  })

  it('data de referência e serialização', () => {
    const { filtros } = lerFiltros({ inicio: '2025-01', fim: '2025-06', ind: 'IPCA' }, HOJE)
    expect(dataDeReferencia(filtros, HOJE)).toBe('2025-06-30')
    expect(dataDeReferencia(lerFiltros({}, HOJE).filtros, HOJE)).toBe(HOJE)
    expect(filtrosParaBusca(filtros)).toBe('inicio=2025-01&fim=2025-06&ind=IPCA')
  })
})

describe('formatos pt-BR', () => {
  it('números, percentuais, pontos e moeda', () => {
    expect(formatarNumero('1234.565')).toBe('1.234,57')
    expect(formatarPercentual('12.5')).toBe('12,50%')
    expect(formatarPercentual('1.2', 1, true)).toBe('+1,2%')
    expect(formatarPontos('-0.5')).toBe('-0,50 p.p.')
    expect(formatarMoeda('1234.56').replace(/\s/g, ' ')).toBe('R$ 1.234,56')
  })

  it('datas', () => {
    expect(formatarData('2026-03-05')).toBe('05/03/2026')
    expect(formatarMesAno('2026-03')).toBe('03/2026')
    expect(formatarDataHora('2026-10-06T13:05:00Z')).toBe('06/10/2026 10:05')
  })
})
