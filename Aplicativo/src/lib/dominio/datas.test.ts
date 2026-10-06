import { describe, expect, it } from 'vitest'
import { hojeEmSaoPaulo, inicioDaSemana, listarMeses, mesmoDiaAnoAnterior, somarMeses, ultimoDia, ultimoPontoAte } from './datas'

describe('datas', () => {
  it('soma meses atravessando o ano', () => {
    expect(somarMeses('2025-11', 3)).toBe('2026-02')
    expect(somarMeses('2026-01', -1)).toBe('2025-12')
    expect(somarMeses('2026-03', -24)).toBe('2024-03')
  })

  it('último dia do mês, inclusive fevereiro bissexto', () => {
    expect(ultimoDia('2024-02')).toBe('2024-02-29')
    expect(ultimoDia('2026-02')).toBe('2026-02-28')
    expect(ultimoDia('2026-12')).toBe('2026-12-31')
  })

  it('mesma data um ano antes, com 29/02', () => {
    expect(mesmoDiaAnoAnterior('2024-02-29')).toBe('2023-02-28')
    expect(mesmoDiaAnoAnterior('2026-10-06')).toBe('2025-10-06')
  })

  it('lista meses inclusive', () => {
    expect(listarMeses('2025-11', '2026-02')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
    expect(listarMeses('2026-03', '2026-02')).toEqual([])
  })

  it('início da semana é segunda-feira', () => {
    expect(inicioDaSemana('2026-10-04')).toBe('2026-09-28') // domingo
    expect(inicioDaSemana('2026-10-05')).toBe('2026-10-05') // segunda
  })

  it('último ponto até a data', () => {
    const serie = [{ data: '2026-01-02', valor: '1' }, { data: '2026-01-05', valor: '2' }]
    expect(ultimoPontoAte(serie, '2026-01-04')?.valor).toBe('1')
    expect(ultimoPontoAte(serie, '2026-01-01')).toBeUndefined()
  })

  it('hoje em São Paulo considera o fuso (UTC−3)', () => {
    expect(hojeEmSaoPaulo(new Date('2026-10-06T02:00:00Z'))).toBe('2026-10-05')
  })
})
